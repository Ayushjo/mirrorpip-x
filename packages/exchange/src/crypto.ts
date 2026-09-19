import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

// AES-256-GCM secret vault for exchange API keys.
// Stored form: base64(iv):base64(authTag):base64(ciphertext).
// The 32-byte key comes from CREDENTIAL_ENCRYPTION_KEY (base64). The web app
// encrypts on connect; the engine decrypts in-process to sign requests. Neither
// ever logs or returns plaintext secrets.

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12; // GCM standard nonce length

function getKey(): Buffer {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY is not set — cannot handle exchange secrets.');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${key.length}). ` +
        'Generate one with: openssl rand -base64 32',
    );
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptSecret(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Malformed encrypted secret.');
  const [ivB64, tagB64, dataB64] = parts as [string, string, string];
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

/** Last 4 chars of a public API key — safe to persist and display. */
export function last4(apiKey: string): string {
  return apiKey.slice(-4);
}

/**
 * Stable, non-reversible identity for duplicate-key detection. The API key is
 * never stored in plaintext and the fingerprint cannot be used to authenticate.
 */
export function fingerprintApiKey(exchange: string, apiKey: string): string {
  return createHmac('sha256', getKey())
    .update(`${exchange}:${apiKey.trim()}`)
    .digest('hex');
}
