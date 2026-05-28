import type { Animal } from "@/types/animal";

export interface RoutePoint {
  lat: number;
  lng: number;
  ts: string;
  speedKmh: number;
}

/**
 * Synthetic GPS history — random walk backwards from the current
 * position. Deterministic per (animal, range) so re-renders stay stable.
 */
export function generateRoute(
  animal: Animal,
  range: "24h" | "7d",
): RoutePoint[] {
  const totalPoints = range === "24h" ? 48 : 168; // every 30min or hourly
  const stepMs = range === "24h" ? 30 * 60_000 : 60 * 60_000;
  // ~30m per step normally, larger steps for horses
  const stepM =
    animal.species === "морь"
      ? 80
      : animal.species === "үхэр"
        ? 50
        : 30;

  // Seeded PRNG so the path is stable
  let s = hashSeed(animal.id) ^ (range === "24h" ? 0x24 : 0x07);
  const rand = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };

  const now = new Date(animal.lastSeenAt).getTime();
  const points: RoutePoint[] = [];
  let lat = animal.lat;
  let lng = animal.lng;

  // Build backwards in time, then reverse so oldest → newest
  for (let i = 0; i < totalPoints; i++) {
    const ts = new Date(now - i * stepMs).toISOString();
    const speed =
      i === 0 ? animal.speedKmh : Math.round(rand() * 30) / 10;
    points.push({ lat, lng, ts, speedKmh: speed });

    // Random walk step
    const bearing = rand() * Math.PI * 2;
    const r = stepM * (0.4 + rand() * 1.2);
    const dLat = (r * Math.cos(bearing)) / 111_000;
    const dLng = (r * Math.sin(bearing)) / (111_000 * Math.cos((lat * Math.PI) / 180));
    lat -= dLat;
    lng -= dLng;
  }

  return points.reverse();
}

function hashSeed(s: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}
