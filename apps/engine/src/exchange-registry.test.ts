import { describe, expect, it } from 'vitest';
import { exchangeRegistry, getExchange } from '@mirrorpip/exchange';

describe('exchange registry', () => {
  it('exposes the four connectable exchanges', () => {
    expect(exchangeRegistry.filter((entry) => entry.availability === 'ACTIVE').map((entry) => entry.id)).toEqual([
      'DELTA_INDIA', 'SHARK', 'PI42', 'MUDREX',
    ]);
  });

  it('keeps CoinSwitch and Binance unavailable', () => {
    expect(exchangeRegistry.find((entry) => entry.id === 'COINSWITCH')?.availability).toBe('DISABLED');
    expect(exchangeRegistry.find((entry) => entry.id === 'BINANCE')?.availability).toBe('COMING_SOON');
  });

  it('resolves every active adapter independently', () => {
    for (const entry of exchangeRegistry.filter((item) => item.availability === 'ACTIVE')) {
      expect(getExchange(entry.id).id).toBe(entry.id);
    }
  });

  it('marks Mudrex as polling and Pi42/Shark as private streams', () => {
    expect(getExchange('MUDREX').capabilities?.fillSource).toBe('POLLING');
    expect(getExchange('PI42').capabilities?.fillSource).toBe('WEBSOCKET');
    expect(getExchange('SHARK').capabilities?.fillSource).toBe('WEBSOCKET');
  });
});
