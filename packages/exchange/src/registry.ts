import type { ExchangeId, TradeCurrency } from './types.js';

export interface ExchangeRegistryItem {
  id: ExchangeId | 'COINSWITCH' | 'BINANCE' | 'SHARK';
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
  { id: 'COINSWITCH', displayName: 'CoinSwitch', availability: 'DISABLED', message: 'No longer available', supportedCurrencies: [], requiredFields: [], credentialInstructions: '', fillSource: null },
  { id: 'BINANCE', displayName: 'Binance', availability: 'COMING_SOON', message: 'Coming soon', supportedCurrencies: [], requiredFields: [], credentialInstructions: '', fillSource: null },
  { id: 'SHARK', displayName: 'Shark', availability: 'COMING_SOON', message: 'Coming soon', supportedCurrencies: [], requiredFields: [], credentialInstructions: '', fillSource: null },
];

export function getExchangeRegistryItem(id: string) {
  return exchangeRegistry.find((item) => item.id === id);
}
