import type { ExchangeId, TradeCurrency } from './types.js';

export interface ExchangeRegistryItem {
  id: ExchangeId | 'COINSWITCH' | 'BINANCE';
  displayName: string;
  availability: 'ACTIVE' | 'DISABLED' | 'COMING_SOON';
  message?: string;
  supportedCurrencies: TradeCurrency[];
  requiredFields: Array<{ id: 'apiKey' | 'apiSecret'; label: string; secret: boolean }>;
  credentialInstructions: string;
  fillSource: 'WEBSOCKET' | 'POLLING' | null;
}

export const exchangeRegistry: ExchangeRegistryItem[] = [
  { id: 'DELTA_INDIA', displayName: 'Delta India', availability: 'ACTIVE', supportedCurrencies: ['USDT'], requiredFields: [{ id: 'apiKey', label: 'API key', secret: false }, { id: 'apiSecret', label: 'API secret', secret: true }], credentialInstructions: 'Enable read and trading permissions. Keep withdrawals disabled.', fillSource: 'WEBSOCKET' },
  { id: 'SHARK', displayName: 'Shark', availability: 'ACTIVE', supportedCurrencies: ['USDT'], requiredFields: [{ id: 'apiKey', label: 'API key', secret: false }, { id: 'apiSecret', label: 'API secret', secret: true }], credentialInstructions: 'Enable read and trading permissions. Withdrawal permission must remain disabled.', fillSource: 'WEBSOCKET' },
  { id: 'PI42', displayName: 'Pi42', availability: 'ACTIVE', supportedCurrencies: ['INR'], requiredFields: [{ id: 'apiKey', label: 'API key', secret: false }, { id: 'apiSecret', label: 'API secret', secret: true }], credentialInstructions: 'Enable read and futures trading permissions. Keep withdrawals disabled.', fillSource: 'WEBSOCKET' },
  { id: 'MUDREX', displayName: 'Mudrex', availability: 'ACTIVE', supportedCurrencies: ['USDT', 'INR'], requiredFields: [{ id: 'apiKey', label: 'API key / account identifier', secret: false }, { id: 'apiSecret', label: 'API secret', secret: true }], credentialInstructions: 'Create a futures trading API key. MirrorPip never calls transfer, deposit, or withdrawal APIs.', fillSource: 'POLLING' },
  { id: 'COINSWITCH', displayName: 'CoinSwitch', availability: 'DISABLED', message: 'No longer available', supportedCurrencies: [], requiredFields: [], credentialInstructions: '', fillSource: null },
  { id: 'BINANCE', displayName: 'Binance', availability: 'COMING_SOON', message: 'Coming soon', supportedCurrencies: [], requiredFields: [], credentialInstructions: '', fillSource: null },
];

export function getExchangeRegistryItem(id: string) {
  return exchangeRegistry.find((item) => item.id === id);
}
