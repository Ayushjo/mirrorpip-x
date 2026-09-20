import type { NextRequest } from 'next/server';
import { ok, route } from '@/lib/api';

export const runtime = 'nodejs';

type PostalHit = { city: string | null; state: string | null; country: string | null; countryCode: string | null };

// India Post (free, no key): best match for 6-digit Indian PINs.
async function lookupIndia(code: string): Promise<PostalHit | null> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(code)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ Status: string; PostOffice?: Array<{ District: string; State: string; Country: string }> }>;
    const po = data?.[0]?.PostOffice?.[0];
    if (!po) return null;
    return { city: po.District ?? null, state: po.State ?? null, country: po.Country ?? 'India', countryCode: 'IN' };
  } catch {
    return null;
  }
}

// Generic fallback for non-Indian postal codes via OpenStreetMap Nominatim.
async function lookupNominatim(code: string): Promise<PostalHit | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(code)}&format=json&addressdetails=1&limit=1`,
      { headers: { 'User-Agent': 'belivemeguys/1.0 (postal autofill)' }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const hits = (await res.json()) as Array<{ address?: Record<string, string> }>;
    const a = hits?.[0]?.address;
    if (!a) return null;
    const city = a.city || a.town || a.village || a.state_district || a.county || null;
    return { city, state: a.state ?? null, country: a.country ?? null, countryCode: (a.country_code ?? '').toUpperCase() || null };
  } catch {
    return null;
  }
}

/** Resolve a postal/PIN code to a city + country to autofill the profile form. */
export function GET(req: NextRequest): Promise<Response> {
  return route(async () => {
    const code = (req.nextUrl.searchParams.get('code') ?? '').trim();
    if (code.length < 3) return ok<PostalHit>({ city: null, state: null, country: null, countryCode: null });
    const isIndianPin = /^\d{6}$/.test(code);
    const hit = (isIndianPin ? await lookupIndia(code) : null) ?? (await lookupNominatim(code));
    return ok<PostalHit>(hit ?? { city: null, state: null, country: null, countryCode: null });
  });
}
