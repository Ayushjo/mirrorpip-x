import type { Prisma } from '@mirrorpip/db';

// Prisma Decimal serializes to a string; normalize to number for the client.
type Decimalish = Prisma.Decimal | number | string | null | undefined;

export function dec(v: Decimalish): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

export function decOr0(v: Decimalish): number {
  return dec(v) ?? 0;
}

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}
