// Prisma Decimal serializes to a string; normalize to number for the client.
// Accepts unknown because Prisma's Decimal columns widen to unknown in some
// select shapes; anything not number-like becomes null.
export function dec(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}

export function decOr0(v: unknown): number {
  return dec(v) ?? 0;
}

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}
