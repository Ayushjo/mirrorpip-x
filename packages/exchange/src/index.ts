export * from './types.js';
export * from './crypto.js';
export { DeltaIndiaExchange, deltaIndia } from './delta.js';

import type { Exchange } from './types.js';
import { deltaIndia } from './delta.js';

// Resolve an adapter by our DB `Exchange` enum value.
export function getExchange(id: string): Exchange {
  switch (id) {
    case 'DELTA_INDIA':
      return deltaIndia;
    // case 'BYBIT': return bybit; // future
    default:
      throw new Error(`No exchange adapter for "${id}"`);
  }
}
