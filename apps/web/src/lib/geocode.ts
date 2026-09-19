import { prisma } from '@belivemeguys/db';

// Best-effort geocoding of a user's signup location via OSM Nominatim.
// Fills lat/lng for the admin geo view; failures are silent (never block auth).
export async function geocodeUserIfNeeded(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, city: true, postalCode: true, country: true, locationUpdatedAt: true },
  });
  if (!user || user.locationUpdatedAt) return;
  const q = [user.city, user.postalCode, user.country].filter(Boolean).join(' ');
  if (q.length < 3) return;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'belivemeguys/1.0 (admin geo view)' }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return;
    const hits = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = hits[0];
    if (!hit) return;
    await prisma.user.update({
      where: { id: userId },
      data: { lat: Number(hit.lat), lng: Number(hit.lon), locationUpdatedAt: new Date() },
    });
  } catch {
    // geocoding is decorative — ignore failures
  }
}
