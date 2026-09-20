import { describe, expect, it } from 'vitest';
import { exchangeRegistry, getExchange } from '@belivemeguys/exchange';

describe('exchange registry', () => {
  it('exposes Delta India as the only connectable exchange', () => {
    expect(exchangeRegistry.filter((entry) => entry.availability === 'ACTIVE').map((entry) => entry.id)).toEqual([
      'DELTA_INDIA',
    ]);
  });

  it('keeps CoinSwitch, Binance and Shark unavailable', () => {
    expect(exchangeRegistry.find((entry) => entry.id === 'COINSWITCH')?.availability).toBe('DISABLED');
    expect(exchangeRegistry.find((entry) => entry.id === 'BINANCE')?.availability).toBe('COMING_SOON');
    expect(exchangeRegistry.find((entry) => entry.id === 'SHARK')?.availability).toBe('COMING_SOON');
  });

  it('resolves every active adapter independently', () => {
    for (const entry of exchangeRegistry.filter((item) => item.availability === 'ACTIVE')) {
      expect(getExchange(entry.id).id).toBe(entry.id);
    }
  });
});
