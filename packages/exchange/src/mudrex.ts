import type { ApiCredentials, Exchange, FillEvent, FillStream, InstrumentInfo, OrderRequest, OrderResult, PositionInfo, VerifyResult } from './types.js';
import { ExchangeAuthError, ExchangeRequestError } from './types.js';

const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const list = (p: any): any[] => Array.isArray(p?.data) ? p.data : Array.isArray(p?.data?.data) ? p.data.data : Array.isArray(p) ? p : [];

export class MudrexExchange implements Exchange {
  readonly id = 'MUDREX' as const;
  readonly capabilities = { fillSource: 'POLLING' as const, currencies: ['USDT', 'INR'] as const, liveOrdersEnabled: process.env.MUDREX_ORDERS_ENABLED === 'true' && process.env.LIVE_EXCHANGE_CANARY === '1' };
  private readonly rest = process.env.MUDREX_REST_URL ?? 'https://trade.mudrex.com/fapi/v1';

  private async request(creds: ApiCredentials, method: string, path: string, body?: unknown) {
    const response = await fetch(`${this.rest}${path}`, { method, headers: { 'content-type': 'application/json', 'X-Authentication': creds.apiSecret }, body: body ? JSON.stringify(body) : undefined });
    const payload: any = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) throw new ExchangeAuthError();
    if (!response.ok) throw new ExchangeRequestError(payload?.message ?? 'Mudrex request failed', response.status);
    return payload;
  }

  async verify(c: ApiCredentials): Promise<VerifyResult> { return { ok: true, canTrade: true, ...(await this.getAccount(c)) }; }
  async getAccount(c: ApiCredentials) { const p = await this.request(c, 'GET', '/wallet'); const d = p?.data ?? p; const nativeEquity = n(d.total_balance ?? d.wallet_balance ?? d.balance); const currency = c.tradeCurrency ?? 'USDT'; return { equityUsd: currency === 'USDT' ? nativeEquity : 0, baseCurrency: currency, nativeEquity, nativeCurrency: currency, conversionRate: currency === 'USDT' ? 1 : undefined }; }
  async getPositions(c: ApiCredentials): Promise<PositionInfo[]> { return list(await this.request(c, 'GET', '/positions')).map(p => ({ symbol: p.symbol, nativeSymbol: p.symbol, canonicalSymbol: p.symbol, quoteCurrency: c.tradeCurrency ?? 'USDT', size: n(p.quantity ?? p.size) * (String(p.side).toUpperCase() === 'SHORT' ? -1 : 1), avgEntry: n(p.average_price ?? p.entry_price), markPrice: n(p.mark_price) || null, unrealizedPnl: n(p.unrealized_pnl), nativePnl: n(p.unrealized_pnl) })); }
  async getRecentFills(c: ApiCredentials, limit = 50): Promise<FillEvent[]> { const assets = await this.loadAssets().catch(() => new Map<string, InstrumentInfo>()); return list(await this.request(c, 'GET', `/orders?limit=${limit}`)).filter(o => ['FILLED', 'PARTIALLY_FILLED', 'COMPLETED'].includes(String(o.status).toUpperCase())).map(o => { const inst = assets.get(o.symbol); return { externalId: String(o.trade_id ?? o.order_id ?? o.id), symbol: o.symbol, nativeSymbol: o.symbol, canonicalSymbol: o.symbol, quoteCurrency: c.tradeCurrency ?? 'USDT', baseAsset: inst?.baseAsset, quoteAsset: inst?.quoteCurrency, contractMultiplier: inst?.contractMultiplier, side: String(o.side).toUpperCase() === 'SELL' ? 'SELL' : 'BUY', qty: n(o.filled_quantity ?? o.executed_quantity ?? o.quantity), price: n(o.average_price ?? o.price), nativePrice: n(o.average_price ?? o.price), reduceOnly: Boolean(o.reduce_only), timestamp: new Date(o.updated_at ?? o.created_at ?? Date.now()) }; }); }

  private assets?: Map<string, InstrumentInfo>;
  private async loadAssets(): Promise<Map<string, InstrumentInfo>> {
    if (this.assets) return this.assets;
    const response = await fetch(`${this.rest}/assets`);
    // Only cache a successful catalog — a failed fetch must not poison the
    // cache for the process lifetime (a 401/5xx would make every later
    // resolveInstrument/getInstrument return null permanently).
    if (!response.ok) throw new ExchangeRequestError(`Could not load Mudrex assets (${response.status})`, response.status);
    const map = new Map<string, InstrumentInfo>();
    for (const a of list(await response.json())) {
      map.set(a.symbol, { symbol: a.symbol, canonicalSymbol: a.symbol, baseAsset: a.base_asset ?? String(a.symbol).replace(/(USDT|INR)$/, ''), quoteCurrency: a.quote_asset ?? 'USDT', contractMultiplier: n(a.contract_multiplier) || 1, minQty: n(a.minimum_quantity), qtyStep: n(a.quantity_step) || 1, minNotional: n(a.minimum_notional), orderTypes: ['MARKET'] });
    }
    this.assets = map;
    return map;
  }
  async getInstrument(symbol: string): Promise<InstrumentInfo | null> { return (await this.loadAssets()).get(symbol) ?? null; }
  async resolveInstrument(fill: FillEvent): Promise<InstrumentInfo | null> {
    const assets = [...(await this.loadAssets()).values()];
    if (!fill.baseAsset) return assets.find((i) => i.symbol === fill.symbol) ?? null;
    const baseUp = fill.baseAsset.toUpperCase();
    const quoteUp = fill.quoteAsset?.toUpperCase();
    const baseMatches = assets.filter((i) => i.baseAsset?.toUpperCase() === baseUp);
    return baseMatches.find((i) => i.quoteCurrency?.toUpperCase() === quoteUp) ?? baseMatches[0] ?? null;
  }
  async getMarkPrice(symbol: string) { const response = await fetch(`${this.rest}/ticker?symbol=${encodeURIComponent(symbol)}`); if (!response.ok) return null; const p: any = await response.json(); return n(p?.data?.mark_price ?? p?.mark_price ?? p?.price) || null; }
  async placeMarketOrder(c: ApiCredentials, o: OrderRequest): Promise<OrderResult> { if (!this.capabilities.liveOrdersEnabled) throw new ExchangeRequestError('Mudrex live orders are disabled pending a manually armed canary.', 503); const i = await this.getInstrument(o.symbol); if (!i) throw new ExchangeRequestError(`Unsupported instrument ${o.symbol}`, 400); const qty = Math.floor((o.qty + 1e-12) / i.qtyStep) * i.qtyStep; if (qty < i.minQty) throw new ExchangeRequestError('Order quantity is below the venue minimum.', 400); const p = await this.request(c, 'POST', '/orders', { symbol: o.symbol, side: o.side, order_type: 'MARKET', quantity: qty, reduce_only: Boolean(o.reduceOnly), client_order_id: o.clientOrderId.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32), currency: c.tradeCurrency ?? 'USDT' }); const d = p?.data ?? p; return { exchOrderId: String(d.order_id ?? d.id), status: 'SUBMITTED', filledQty: n(d.filled_quantity), avgPrice: n(d.average_price) || null, raw: p }; }
  async streamFills(c: ApiCredentials, h: { onFill: (f: FillEvent) => void; onError?: (e: Error) => void }): Promise<FillStream> { let closed = false; const seen = new Set((await this.getRecentFills(c, 100)).map(f => f.externalId)); let timer: ReturnType<typeof setTimeout>; let delay = 2000; const poll = async () => { if (closed) return; try { for (const fill of (await this.getRecentFills(c, 100)).reverse()) if (!seen.has(fill.externalId)) { seen.add(fill.externalId); h.onFill(fill); } delay = 2000; } catch (e) { h.onError?.(e as Error); delay = Math.min(delay * 2, 30000); } timer = setTimeout(poll, delay); }; timer = setTimeout(poll, delay); return { close: () => { closed = true; clearTimeout(timer); } }; }
}

export const mudrex = new MudrexExchange();
