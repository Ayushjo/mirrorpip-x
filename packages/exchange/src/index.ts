export * from './types.js';
export * from './crypto.js';
export * from './registry.js';
export { DeltaIndiaExchange, deltaIndia } from './delta.js';
export { Pi42Exchange, SharkExchange, pi42, shark } from './pi42-shark.js';
export { MudrexExchange, mudrex } from './mudrex.js';

import type { Exchange } from './types.js';
import { deltaIndia } from './delta.js';
import { pi42, shark } from './pi42-shark.js';
import { mudrex } from './mudrex.js';

// Resolve an adapter by our DB `Exchange` enum value.
export function getExchange(id: string): Exchange {
  switch (id) {
    case 'DELTA_INDIA':
      return deltaIndia;
    case 'PI42': return pi42;
    case 'SHARK': return shark;
    case 'MUDREX': return mudrex;
    // case 'BYBIT': return bybit; // future
    default:
      throw new Error(`No exchange adapter for "${id}"`);
  }
}
