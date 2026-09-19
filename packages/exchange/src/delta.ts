import { createHash, createHmac } from 'node:crypto';
import WebSocket from 'ws';
import {
  type ApiCredentials,
  type AccountInfo,
  type Exchange,
  type FillEvent,
  type FillStream,
  type InstrumentInfo,
  type OrderRequest,
  type OrderResult,
  type PositionInfo,
  type VerifyResult,
  ExchangeAuthError,
  ExchangeRequestError,
} from './types.js';

// Delta Exchange India adapter.
// Docs: https://docs.delta.exchange — REST signature is
//   HMAC_SHA256(secret, method + timestamp(sec) + path + query + body) -> hex
// placed in the `signature` header alongside `api-key` and `timestamp`.

// Read endpoint config lazily (per call) rather than at module load — otherwise
// ESM import hoisting can freeze these before dotenv runs, silently pinning the
// production default even when .env selects testnet.
const restUrl = (): string => process.env.DELTA_REST_URL ?? 'https://api.india.delta.exchange';
const wsUrl = (): string => process.env.DELTA_WS_URL ?? 'wss://socket.india.delta.exchange';
const USER_AGENT = 'mirrorpip-x/0.1';

function nowSec(): string {
  return Math.floor(Date.now() / 1000).toString();
}

function sign(secret: string, method: string, path: string, query: string, body: string): { signature: string; timestamp: string } {
  const timestamp = nowSec();
  const prehash = method + timestamp + path + query + body;
  const signature = createHmac('sha256', secret).update(prehash).digest('hex');
  return { signature, timestamp };
}

interface DeltaEnvelope<T> {
  success: boolean;
  result: T;
  error?: { code?: string; message?: string } | string;
}

async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${restUrl()}${path}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  const json = (await res.json().catch(() => null)) as DeltaEnvelope<T> | null;
  if (!res.ok || !json?.success) {
    throw new ExchangeRequestError(`Delta public GET ${path} failed (${res.status})`, res.status);
  }
  return json.result;
}

async function signedRequest<T>(
  creds: ApiCredentials,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  opts: { query?: Record<string, string | number>; body?: unknown } = {},
): Promise<T> {
  const queryString = opts.query
    ? '?' +
      Object.entries(opts.query)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const bodyString = opts.body !== undefined ? JSON.stringify(opts.body) : '';

  const { signature, timestamp } = sign(creds.apiSecret, method, path, queryString, bodyString);

  const res = await fetch(`${restUrl()}${path}${queryString}`, {
    method,
    headers: {
      'api-key': creds.apiKey,
      signature,
      timestamp,
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: method === 'GET' ? undefined : bodyString,
  });

  const json = (await res.json().catch(() => null)) as DeltaEnvelope<T> | null;

  if (res.status === 401 || (json && !json.success && /invalid.*(api|key|signature)|unauthorized/i.test(JSON.stringify(json.error ?? '')))) {
    throw new ExchangeAuthError();
  }
  if (!res.ok || !json?.success) {
    const msg = typeof json?.error === 'string' ? json.error : json?.error?.message ?? res.statusText;
    throw new ExchangeRequestError(`Delta ${method} ${path} failed: ${msg}`, res.status);
  }
  return json.result;
}

// ─── product (symbol -> product_id) cache ──────────────────────────────────────

interface DeltaProduct {
  id: number;
  symbol: string;
  contract_type?: string;
  state?: string;
  contract_value?: string;
  contract_unit_currency?: string;
  quoting_asset?: { symbol?: string };
  tick_size?: string;
}

let productCache: Map<string, DeltaProduct> | null = null;
let productCacheAt = 0;
const PRODUCT_TTL_MS = 10 * 60 * 1000;

async function loadProducts(): Promise<Map<string, DeltaProduct>> {
  if (productCache && Date.now() - productCacheAt < PRODUCT_TTL_MS) return productCache;
  const products = await publicGet<DeltaProduct[]>('/v2/products');
  const map = new Map<string, DeltaProduct>();
  for (const p of products) map.set(p.symbol, p);
  productCache = map;
  productCacheAt = Date.now();
  return map;
}

async function productIdFor(symbol: string): Promise<number> {
  const map = await loadProducts();
  const p = map.get(symbol);
  if (!p) throw new ExchangeRequestError(`Unknown Delta symbol: ${symbol}`);
  return p.id;
}

/** Canonical identity of a Delta product symbol for cross-venue matching. */
function productMeta(p?: DeltaProduct): { baseAsset?: string; quoteAsset?: string; contractMultiplier?: number } {
  if (!p) return {};
  return {
    baseAsset: p.contract_unit_currency,
    quoteAsset: p.quoting_asset?.symbol,
    contractMultiplier: num(p.contract_value, 1),
  };
}

/** Exact base+quote match preferred; falls back to base-asset only (different quote is still the same directional exposure). */
function matchInstrument<T extends { base?: string; quote?: string }>(
  items: T[],
  baseAsset: string | undefined,
  quoteAsset: string | undefined,
  pick: (item: T) => boolean,
): T | undefined {
  if (!baseAsset) return undefined;
  const baseUp = baseAsset.toUpperCase();
  const quoteUp = quoteAsset?.toUpperCase();
  const baseMatches = items.filter((i) => i.base?.toUpperCase() === baseUp && pick(i));
  return baseMatches.find((i) => i.quote?.toUpperCase() === quoteUp) ?? baseMatches[0];
}

// ─── shapes ─────────────────────────────────────────────────────────────────

interface DeltaBalance {
  asset_symbol?: string;
  balance?: string;
  available_balance?: string;
}

interface DeltaPosition {
  product_symbol?: string;
  size?: number;
  entry_price?: string;
  mark_price?: string;
  unrealized_pnl?: string;
}

interface DeltaOrder {
  id?: number;
  state?: string;
  size?: number;
  unfilled_size?: number;
  average_fill_price?: string;
}

interface DeltaTicker {
  mark_price?: string;
  close?: string;
}

function num(v: string | number | undefined | null, fallback = 0): number {
  if (v === undefined || v === null) return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ─── adapter ──────────────────────────────────────────────────────────────────

export class DeltaIndiaExchange implements Exchange {
  readonly id = 'DELTA_INDIA' as const;

  async getAccount(creds: ApiCredentials): Promise<AccountInfo> {
    const balances = await signedRequest<DeltaBalance[]>(creds, 'GET', '/v2/wallet/balances');
    // Sum balances as USD-equivalent. Delta India perpetuals settle in USDT, so
    // treating balance figures as USD is accurate enough for proportional sizing.
    const equityUsd = balances.reduce((sum, b) => sum + num(b.balance), 0);
    const base = balances.find((b) => num(b.balance) > 0)?.asset_symbol ?? 'USDT';
    return { equityUsd, baseCurrency: base };
  }

  async verify(creds: ApiCredentials): Promise<VerifyResult> {
    // Delta documents wallet and position APIs as requiring Trading permission.
    // Calling both verifies the scope without creating, editing, or cancelling
    // an order.
    const [account] = await Promise.all([this.getAccount(creds), this.getPositions(creds)]);
    return { ok: true, canTrade: true, ...account };
  }

  async getInstrument(symbol: string): Promise<InstrumentInfo | null> {
    const product = (await loadProducts()).get(symbol);
    if (!product) return null;
    return {
      symbol,
      canonicalSymbol: symbol,
      baseAsset: product.contract_unit_currency ?? symbol.replace(/USD(T)?$/, ''),
      quoteCurrency: product.quoting_asset?.symbol ?? 'USD',
      contractMultiplier: num(product.contract_value, 1),
      minQty: 1,
      qtyStep: 1,
      minNotional: 0,
      orderTypes: ['MARKET', 'LIMIT'],
    };
  }

  async resolveInstrument(fill: FillEvent): Promise<InstrumentInfo | null> {
    const products = [...(await loadProducts()).values()].map((p) => ({
      p,
      base: p.contract_unit_currency,
      quote: p.quoting_asset?.symbol,
    }));
    // If the fill lacks canonical fields, its symbol may still be a native
    // Delta symbol — look it up directly first.
    const direct = products.find((x) => x.p.symbol === fill.symbol);
    if (direct && !fill.baseAsset) return this.getInstrument(direct.p.symbol);
    // Cross-venue match: only live perpetual futures are copy targets —
    // options/dated futures are never the right destination for a perp fill.
    const isLivePerp = (x: { p: DeltaProduct }) => x.p.contract_type === 'perpetual_futures' && x.p.state === 'live';
    const match = matchInstrument(products, fill.baseAsset, fill.quoteAsset, isLivePerp);
    return match ? this.getInstrument(match.p.symbol) : null;
  }

  async getPositions(creds: ApiCredentials): Promise<PositionInfo[]> {
    const positions = await signedRequest<DeltaPosition[]>(creds, 'GET', '/v2/positions/margined');
    return positions
      .filter((p) => p.product_symbol && num(p.size) !== 0)
      .map((p) => ({
        symbol: p.product_symbol as string,
        size: num(p.size),
        avgEntry: num(p.entry_price),
        markPrice: p.mark_price ? num(p.mark_price) : null,
        unrealizedPnl: num(p.unrealized_pnl),
      }));
  }

  async getRecentFills(creds: ApiCredentials, limit = 50): Promise<FillEvent[]> {
    // GET /v2/fills — recent user fills (newest first).
    const rows = await signedRequest<Array<Record<string, unknown>>>(creds, 'GET', '/v2/fills', {
      query: { page_size: limit },
    }).catch(() => [] as Array<Record<string, unknown>>);
    const products = await loadProducts().catch(() => new Map<string, DeltaProduct>());
    const out: FillEvent[] = [];
    for (const f of rows) {
      const side = String(f.side ?? '').toUpperCase();
      const symbol = (f.product_symbol ?? f.symbol) as string | undefined;
      const id = f.id ?? f.fill_id;
      const size = num(f.size as number);
      if (!id || !symbol || (side !== 'BUY' && side !== 'SELL') || size <= 0) continue;
      // created_at may be ISO or microseconds.
      const rawTs = f.created_at ?? f.timestamp;
      const ts =
        typeof rawTs === 'string'
          ? new Date(rawTs)
          : rawTs
            ? new Date(Number(rawTs) / 1000)
            : new Date();
      out.push({
        externalId: String(id),
        symbol: String(symbol),
        side: side as 'BUY' | 'SELL',
        qty: size,
        price: num(f.price as string),
        reduceOnly: Boolean(f.reduce_only),
        positionKey: String(symbol),
        timestamp: ts,
        ...productMeta(products.get(String(symbol))),
      });
    }
    return out;
  }

  async placeMarketOrder(creds: ApiCredentials, order: OrderRequest): Promise<OrderResult> {
    const productId = await productIdFor(order.symbol);
    // Delta size is integer contracts. Round to nearest (not floor) so a computed
    // size like 0.997 becomes 1 — otherwise near-whole sizes floor to 0 and the
    // trade (including the matching close) is dropped.
    const size = Math.max(0, Math.round(order.qty));
    if (size === 0) {
      return { exchOrderId: '', status: 'REJECTED', filledQty: 0, avgPrice: null };
    }
    const body = {
      product_id: productId,
      size,
      side: order.side.toLowerCase(),
      order_type: 'market_order',
      time_in_force: 'ioc',
      reduce_only: order.reduceOnly ?? false,
      client_order_id: `mpx_${createHash('sha256').update(order.clientOrderId).digest('hex').slice(0, 24)}`,
    };
    const result = await signedRequest<DeltaOrder>(creds, 'POST', '/v2/orders', { body });

    const filled = num(result.size) - num(result.unfilled_size);
    const status: OrderResult['status'] =
      result.state === 'closed' || (filled > 0 && num(result.unfilled_size) === 0)
        ? 'FILLED'
        : filled > 0
          ? 'PARTIAL'
          : result.state === 'cancelled'
            ? 'REJECTED'
            : 'SUBMITTED';

    return {
      exchOrderId: String(result.id ?? ''),
      status,
      filledQty: filled > 0 ? filled : status === 'FILLED' ? size : 0,
      avgPrice: result.average_fill_price ? num(result.average_fill_price) : null,
      raw: result,
    };
  }

  async getMarkPrice(symbol: string): Promise<number | null> {
    try {
      const t = await publicGet<DeltaTicker>(`/v2/tickers/${symbol}`);
      const price = t.mark_price ? num(t.mark_price) : t.close ? num(t.close) : null;
      return price;
    } catch {
      return null;
    }
  }

  async streamFills(
    creds: ApiCredentials,
    handlers: { onFill: (fill: FillEvent) => void; onError?: (err: Error) => void },
  ): Promise<FillStream> {
    const ws = new WebSocket(wsUrl(), { headers: { 'User-Agent': USER_AGENT } });

    const closeStream = () => {
      try {
        ws.removeAllListeners();
        ws.close();
      } catch {
        /* noop */
      }
    };

    ws.on('open', () => {
      // WS auth: HMAC over method 'GET' + timestamp + path '/live'.
      const { signature, timestamp } = sign(creds.apiSecret, 'GET', '/live', '', '');
      ws.send(
        JSON.stringify({
          type: 'auth',
          payload: { 'api-key': creds.apiKey, signature, timestamp },
        }),
      );
      // NOTE: subscribe only AFTER the "Authenticated" success arrives (below),
      // otherwise the private subscription races auth and delivers nothing.
    });

    ws.on('message', (raw: WebSocket.RawData) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (process.env.DELTA_DEBUG) console.error('[delta ws]', raw.toString().slice(0, 160));

      // Once authenticated, subscribe to the *verbose* user_trades channel.
      // (The compact "v2/user_trades" channel uses single-letter keys.)
      if (msg.type === 'success' && msg.message === 'Authenticated') {
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            payload: { channels: [{ name: 'user_trades', symbols: ['all'] }] },
          }),
        );
        return;
      }

      // Verified fill shape (Delta testnet user_trades):
      // { type:"user_trades", action:"fill", symbol:"BTCUSD", side:"buy",
      //   size:1, price:"75560", fill_id:"…", timestamp:<microseconds> }
      if (msg.type !== 'user_trades' || msg.action !== 'fill') return;

      const fillId = msg.fill_id;
      const symbol = msg.symbol;
      const sideRaw = String(msg.side ?? '').toUpperCase();
      const size = num(msg.size as number);
      const price = num(msg.price as string);
      // timestamp is in microseconds.
      const ts = msg.timestamp ? new Date(Number(msg.timestamp) / 1000) : new Date();

      if (!fillId || !symbol || (sideRaw !== 'BUY' && sideRaw !== 'SELL') || size <= 0) return;

      // Attach canonical instrument metadata for cross-venue copy.
      void loadProducts()
        .then((products) => {
          handlers.onFill({
            externalId: String(fillId),
            symbol: String(symbol),
            side: sideRaw as 'BUY' | 'SELL',
            qty: size,
            price,
            reduceOnly: Boolean(msg.reduce_only),
            positionKey: String(symbol),
            timestamp: ts,
            ...productMeta(products.get(String(symbol))),
          });
        })
        .catch((err) => handlers.onError?.(err as Error));
    });

    ws.on('error', (err: Error) => handlers.onError?.(err));
    ws.on('close', () => handlers.onError?.(new Error('Delta WS closed')));

    return { close: closeStream };
  }
}

export const deltaIndia = new DeltaIndiaExchange();
