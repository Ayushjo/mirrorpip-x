// Exchange-agnostic domain types + the adapter interface. Delta India is the
// first implementation; new venues (Bybit, ...) implement the same interface so
// the engine and web layer never learn venue-specific details.

export type Side = 'BUY' | 'SELL';

export interface ApiCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface AccountInfo {
  /** Total account equity in the account's settlement/base currency (USD-ish). */
  equityUsd: number;
  baseCurrency: string;
}

export interface VerifyResult extends AccountInfo {
  ok: true;
  /** Whether the key can place orders (vs read-only). */
  canTrade: boolean;
}

export interface OrderRequest {
  symbol: string;
  side: Side;
  /** Contract/coin quantity (venue-native units). */
  qty: number;
  reduceOnly?: boolean;
  /** Deterministic client id for idempotency. */
  clientOrderId: string;
}

export interface OrderResult {
  exchOrderId: string;
  status: 'FILLED' | 'PARTIAL' | 'REJECTED' | 'SUBMITTED';
  filledQty: number;
  avgPrice: number | null;
  raw?: unknown;
}

export interface PositionInfo {
  symbol: string;
  /** Signed size: positive = long, negative = short, 0 = flat. */
  size: number;
  avgEntry: number;
  markPrice: number | null;
  unrealizedPnl: number;
}

/** A leader fill delivered by the private WebSocket stream. */
export interface FillEvent {
  externalId: string;
  symbol: string;
  side: Side;
  qty: number;
  price: number;
  reduceOnly: boolean;
  positionKey?: string;
  timestamp: Date;
}

export interface FillStream {
  /** Stop the stream and release the socket. */
  close(): void;
}

/** Contract every venue adapter fulfills. */
export interface Exchange {
  readonly id: 'DELTA_INDIA' | 'BYBIT';

  /** Validate credentials with a lightweight authenticated read. */
  verify(creds: ApiCredentials): Promise<VerifyResult>;

  getAccount(creds: ApiCredentials): Promise<AccountInfo>;

  getPositions(creds: ApiCredentials): Promise<PositionInfo[]>;

  placeMarketOrder(creds: ApiCredentials, order: OrderRequest): Promise<OrderResult>;

  /** Latest mark price for a symbol (public — no auth). */
  getMarkPrice(symbol: string): Promise<number | null>;

  /**
   * Open an authenticated stream of the account's fills. `onFill` is called for
   * each new fill; `onError` for transport errors (the caller handles reconnect).
   */
  streamFills(
    creds: ApiCredentials,
    handlers: { onFill: (fill: FillEvent) => void; onError?: (err: Error) => void },
  ): Promise<FillStream>;
}

export class ExchangeAuthError extends Error {
  constructor(message = 'Exchange API key is invalid or lacks permission.') {
    super(message);
    this.name = 'ExchangeAuthError';
  }
}

export class ExchangeRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ExchangeRequestError';
  }
}
