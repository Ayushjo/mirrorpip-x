import type { ExchangeCredential } from '@mirrorpip/db';
import { type ApiCredentials, decryptSecret, getExchange } from '@mirrorpip/exchange';

/** Decrypt a stored credential into usable API keys (in-memory only). */
export function toApiCreds(cred: Pick<ExchangeCredential, 'apiKeyEnc' | 'apiSecretEnc'>): ApiCredentials {
  return {
    apiKey: decryptSecret(cred.apiKeyEnc),
    apiSecret: decryptSecret(cred.apiSecretEnc),
  };
}

export { getExchange };
