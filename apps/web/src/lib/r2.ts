import { AwsClient } from 'aws4fetch';

/**
 * Cloudflare R2 (S3-compatible) blob store for user media (avatars). Enabled only
 * when the R2_* env vars are present; otherwise callers fall back to inline
 * storage so local dev works without any Cloudflare setup.
 *
 * Required env:
 *  - R2_ACCOUNT_ID         Cloudflare account id (the S3 endpoint host prefix)
 *  - R2_ACCESS_KEY_ID      R2 API token access key
 *  - R2_SECRET_ACCESS_KEY  R2 API token secret
 *  - R2_BUCKET             bucket name, e.g. "believemeguys-media"
 *  - R2_PUBLIC_URL         public base URL for the bucket (r2.dev or a custom
 *                          domain), no trailing slash, e.g. https://pub-xxx.r2.dev
 */

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucket && publicBase);
}

function client(): AwsClient {
  return new AwsClient({ accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, region: 'auto', service: 's3' });
}

const objectUrl = (key: string): string => `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURI(key)}`;

/** The public URL a stored object is served from. */
export function publicUrl(key: string): string {
  return `${publicBase}/${key}`;
}

/** True if `url` points at our R2 public bucket (so we own it and may delete it). */
export function isR2Url(url: string | null | undefined): boolean {
  return Boolean(url && publicBase && url.startsWith(`${publicBase}/`));
}

/** Derive the object key from one of our public URLs. */
export function keyFromUrl(url: string): string | null {
  if (!publicBase || !url.startsWith(`${publicBase}/`)) return null;
  return url.slice(publicBase.length + 1);
}

/** Upload bytes and return the public URL. Throws on non-2xx. */
export async function uploadObject(key: string, body: ArrayBuffer, contentType: string): Promise<string> {
  const res = await client().fetch(objectUrl(key), {
    method: 'PUT',
    body,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`R2 upload failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return publicUrl(key);
}

/** Best-effort delete; never throws (a failed cleanup shouldn't fail the request). */
export async function deleteObject(key: string): Promise<void> {
  try {
    await client().fetch(objectUrl(key), { method: 'DELETE' });
  } catch {
    /* noop */
  }
}
