import { createHmac } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import type { ApiCredentials, Exchange, FillEvent, FillStream, InstrumentInfo, OrderRequest, OrderResult, PositionInfo, VerifyResult } from './types.js';
import { ExchangeAuthError, ExchangeRequestError } from './types.js';

type VenueConfig = { id: 'PI42' | 'SHARK'; rest: string; socket: string; currency: 'INR' | 'USDT' };

function number(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rows(payload: any): any[] {
  const value = payload?.data ?? payload?.result ?? payload;
  return Array.isArray(value) ? value : Array.isArray(value?.rows) ? value.rows : Array.isArray(value?.list) ? value.list : [];
}

abstract class SignedFuturesExchange implements Exchange {
  readonly id: VenueConfig['id'];
  readonly capabilities;
  private instruments = new Map<string, InstrumentInfo>();
  private fxCache?: { usdPerNative: number; expiresAt: number };

  protected constructor(private readonly config: VenueConfig) {
    this.id = config.id;
    this.capabilities = { fillSource: 'WEBSOCKET' as const, currencies: [config.currency], liveOrdersEnabled: process.env[`${config.id}_ORDERS_ENABLED`] === 'true' };
  }

  private async request(creds: ApiCredentials, method: string, path: string, body?: Record<string, unknown>) {
    const timestamp = Date.now().toString();
    const serialized = body ? JSON.stringify(body) : '';
    const signature = createHmac('sha256', creds.apiSecret).update(`${timestamp}${method.toUpperCase()}${path}${serialized}`).digest('hex');
    const response = await fetch(`${this.config.rest}${path}`, {
      method,
      headers: { 'content-type': 'application/json', 'api-key': creds.apiKey, 'api-secret': signature, timestamp, 'X-API-KEY': creds.apiKey, 'X-SIGNATURE': signature, 'X-TIMESTAMP': timestamp },
      body: body ? serialized : undefined,
    });
    const payload: any = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) throw new ExchangeAuthError();
    if (!response.ok) throw new ExchangeRequestError(payload?.message ?? `${this.id} request failed`, response.status);
    return payload;
  }

  async verify(creds: ApiCredentials): Promise<VerifyResult> {
    const account = await this.getAccount(creds);
    return { ok: true, canTrade: true, ...account };
  }

  async getAccount(creds: ApiCredentials) {
    const payload = await this.request(creds, 'GET', '/v1/wallet');
    const data = payload?.data ?? payload?.result ?? payload;
    const nativeEquity = number(data?.totalWalletBalance ?? data?.total_balance ?? data?.balance ?? data?.equity);
    const conversionRate = await this.usdPerNative();
    return { equityUsd: conversionRate ? nativeEquity * conversionRate : 0, baseCurrency: this.config.currency, nativeEquity, nativeCurrency: this.config.currency, conversionRate };
  }

  async getPositions(creds: ApiCredentials): Promise<PositionInfo[]> {
    const payload = await this.request(creds, 'GET', '/v1/positions');
    return rows(payload).map((p) => ({ symbol: p.symbol ?? p.contract, nativeSymbol: p.symbol ?? p.contract, canonicalSymbol: p.symbol ?? p.contract, quoteCurrency: this.config.currency, size: number(p.positionAmt ?? p.quantity ?? p.size) * (String(p.side).toUpperCase() === 'SHORT' ? -1 : 1), avgEntry: number(p.entryPrice ?? p.averagePrice), markPrice: number(p.markPrice) || null, unrealizedPnl: number(p.unRealizedProfit ?? p.unrealizedPnl), nativePnl: number(p.unRealizedProfit ?? p.unrealizedPnl), pnlUsd: this.config.currency === 'USDT' ? number(p.unRealizedProfit ?? p.unrealizedPnl) : undefined }));
  }

  async getRecentFills(creds: ApiCredentials, limit = 50): Promise<FillEvent[]> {
    const payload = await this.request(creds, 'GET', `/v1/trades?limit=${Math.min(limit, 100)}`);
    const conversionRate = await this.usdPerNative();
    const out = await Promise.all(rows(payload).map((f) => this.normalizeFill(f, conversionRate)));
    return out.filter((f): f is FillEvent => Boolean(f.externalId && f.symbol));
  }

  private async loadInstruments(): Promise<Map<string, InstrumentInfo>> {
    if (this.instruments.size > 0) return this.instruments;
    const response = await fetch(`${this.config.rest}/v1/exchangeInfo`);
    if (!response.ok) throw new ExchangeRequestError(`Could not load ${this.id} instruments`, response.status);
    const payload: any = await response.json();
    for (const item of rows(payload?.symbols ?? payload)) {
      const filters = item.filters ?? [];
      const lot = filters.find((f: any) => f.filterType === 'LOT_SIZE') ?? item;
      const min = filters.find((f: any) => f.filterType === 'MIN_NOTIONAL') ?? item;
      const info: InstrumentInfo = { symbol: item.symbol, canonicalSymbol: item.symbol, baseAsset: item.baseAsset ?? String(item.symbol).replace(/(USDT|INR)$/, ''), quoteCurrency: item.quoteAsset ?? this.config.currency, contractMultiplier: number(item.contractSize) || 1, minQty: number(lot.minQty ?? item.minOrderQty), qtyStep: number(lot.stepSize ?? item.qtyStep) || 1, minNotional: number(min.notional ?? min.minNotional), orderTypes: item.orderTypes ?? ['MARKET'] };
      this.instruments.set(info.symbol, info);
    }
    return this.instruments;
  }

  async getInstrument(symbol: string): Promise<InstrumentInfo | null> {
    return (await this.loadInstruments()).get(symbol) ?? null;
  }

  async resolveInstrument(fill: FillEvent): Promise<InstrumentInfo | null> {
    const instruments = [...(await this.loadInstruments()).values()];
    if (!fill.baseAsset) return instruments.find((i) => i.symbol === fill.symbol) ?? null;
    const baseUp = fill.baseAsset.toUpperCase();
    const quoteUp = fill.quoteAsset?.toUpperCase();
    const baseMatches = instruments.filter((i) => i.baseAsset?.toUpperCase() === baseUp);
    return baseMatches.find((i) => i.quoteCurrency?.toUpperCase() === quoteUp) ?? baseMatches[0] ?? null;
  }

  async getMarkPrice(symbol: string): Promise<number | null> {
    const response = await fetch(`${this.config.rest}/v1/mark-price?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) return null;
    const payload: any = await response.json();
    return number(payload?.data?.markPrice ?? payload?.markPrice ?? payload?.price) || null;
  }

  async placeMarketOrder(creds: ApiCredentials, order: OrderRequest): Promise<OrderResult> {
    if (!this.capabilities.liveOrdersEnabled) throw new ExchangeRequestError(`${this.id} live orders are disabled pending canary validation.`, 503);
    const instrument = await this.getInstrument(order.symbol);
    if (!instrument) throw new ExchangeRequestError(`Unsupported instrument ${order.symbol}`, 400);
    const qty = Math.floor((order.qty + 1e-12) / instrument.qtyStep) * instrument.qtyStep;
    if (qty < instrument.minQty) throw new ExchangeRequestError('Order quantity is below the venue minimum.', 400);
    const payload = await this.request(creds, 'POST', '/v1/order', { symbol: order.symbol, side: order.side, type: 'MARKET', quantity: qty, reduceOnly: Boolean(order.reduceOnly), clientOrderId: order.clientOrderId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) });
    const data = payload?.data ?? payload?.result ?? payload;
    const nativeAvg = number(data.avgPrice);
    const conversionRate = await this.usdPerNative();
    return { exchOrderId: String(data.orderId ?? data.id), status: data.status === 'FILLED' ? 'FILLED' : 'SUBMITTED', filledQty: number(data.executedQty ?? data.filledQty), avgPrice: nativeAvg && conversionRate ? nativeAvg * conversionRate : nativeAvg || null, raw: payload };
  }

  async streamFills(creds: ApiCredentials, handlers: { onFill: (fill: FillEvent) => void; onError?: (err: Error) => void }): Promise<FillStream> {
    const created = await this.request(creds, 'POST', '/v1/retail/listen-key');
    const listenKey = created?.data?.listenKey ?? created?.listenKey;
    if (!listenKey) throw new ExchangeRequestError(`${this.id} did not return a listen key`);
    let socket: Socket | undefined = io(this.config.socket, { transports: ['websocket'], query: { listenKey }, auth: { listenKey } });
    const deliver = (event: any) => { void this.usdPerNative().then((rate) => this.normalizeFill(event?.data ?? event, rate)).then((fill) => { if (fill.externalId && fill.symbol) handlers.onFill(fill); }).catch((error) => handlers.onError?.(error as Error)); };
    socket.on('trade', deliver).on('executionReport', deliver).on('order_update', deliver).on('connect_error', (error) => handlers.onError?.(error));
    const renewal = setInterval(() => void this.request(creds, 'PUT', '/v1/retail/listen-key', { listenKey }).catch((error) => handlers.onError?.(error as Error)), 45 * 60 * 1000);
    return { close: () => { clearInterval(renewal); socket?.removeAllListeners(); socket?.close(); socket = undefined; void this.request(creds, 'DELETE', '/v1/retail/listen-key', { listenKey }).catch(() => undefined); } };
  }

  private async normalizeFill(f: any, conversionRate?: number): Promise<FillEvent> {
    const symbol = String(f.symbol ?? f.s ?? f.contract ?? '');
    const price = number(f.price ?? f.p ?? f.avgPrice);
    const priceUsd = conversionRate ? price * conversionRate : undefined;
    const instrument = symbol ? await this.getInstrument(symbol).catch(() => null) : null;
    return { externalId: String(f.tradeId ?? f.id ?? f.t ?? f.orderId ?? ''), symbol, nativeSymbol: symbol, canonicalSymbol: symbol, quoteCurrency: this.config.currency, baseAsset: instrument?.baseAsset, quoteAsset: instrument?.quoteCurrency, contractMultiplier: instrument?.contractMultiplier, side: String(f.side ?? f.S).toUpperCase() === 'SELL' ? 'SELL' : 'BUY', qty: number(f.quantity ?? f.qty ?? f.q ?? f.executedQty), price: priceUsd ?? price, nativePrice: price, priceUsd, reduceOnly: Boolean(f.reduceOnly), timestamp: new Date(number(f.timestamp ?? f.time ?? f.T) || Date.now()) };
  }

  private async usdPerNative(): Promise<number | undefined> {
    if (this.config.currency === 'USDT') return 1;
    if (this.fxCache && this.fxCache.expiresAt > Date.now()) return this.fxCache.usdPerNative;
    const inrPerUsdt = await this.getMarkPrice('USDTINR');
    if (!inrPerUsdt || inrPerUsdt <= 0) return undefined;
    this.fxCache = { usdPerNative: 1 / inrPerUsdt, expiresAt: Date.now() + 15_000 };
    return this.fxCache.usdPerNative;
  }
}

export class Pi42Exchange extends SignedFuturesExchange { constructor() { super({ id: 'PI42', rest: process.env.PI42_REST_URL ?? 'https://fapi.pi42.com', socket: process.env.PI42_WS_URL ?? 'https://fawss-uds.pi42.com/auth-stream', currency: 'INR' }); } }
export class SharkExchange extends SignedFuturesExchange { constructor() { super({ id: 'SHARK', rest: process.env.SHARK_REST_URL ?? 'https://api.sharkexchange.in', socket: process.env.SHARK_WS_URL ?? 'https://fawss-uds.sharkexchange.in/auth-stream', currency: 'USDT' }); } }
export const pi42 = new Pi42Exchange();
export const shark = new SharkExchange();
