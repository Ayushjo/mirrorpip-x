import type { ExchangeCredential } from '@belivemeguys/db';
import { type ApiCredentials, decryptSecret, getExchange } from '@belivemeguys/exchange';

/** Decrypt a stored credential into usable API keys (in-memory only). */
export function toApiCreds(cred: Pick<ExchangeCredential, 'apiKeyEnc' | 'apiSecretEnc' | 'tradeCurrency' | 'settings'>): ApiCredentials {
  return {
    apiKey: decryptSecret(cred.apiKeyEnc),
    apiSecret: decryptSecret(cred.apiSecretEnc),
    tradeCurrency: cred.tradeCurrency as ApiCredentials['tradeCurrency'],
    settings: (cred.settings ?? {}) as Record<string, unknown>,
  };
}

export { getExchange };
