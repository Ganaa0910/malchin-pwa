import type { Animal, Proximity } from "@/types/animal";
import type { Zone } from "@/types/zone";

const R_EARTH = 6_371_000;

/** Haversine distance in meters. */
export function distanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(a));
}

/** Point-in-polygon — ray casting, polygon coords as [lat,lng] pairs. */
export function pointInPolygon(
  lat: number,
  lng: number,
  polygon: readonly (readonly [number, number])[],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Minimum distance from a point to any edge of a polygon, in meters. */
export function minDistanceToPolygonM(
  lat: number,
  lng: number,
  polygon: readonly (readonly [number, number])[],
): number {
  let min = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const [la, lo] = polygon[i];
    const d = distanceM(lat, lng, la, lo);
    if (d < min) min = d;
  }
  return min;
}

/**
 * 3-tier proximity model.
 *
 * Given an animal and the active zones for its owner:
 *   - SAFE     → inside any pasture/camp zone (deepest point is OK)
 *   - WARNING  → outside, but within zone.bufferM of the nearest border
 *   - DETER    → outside the buffer band → deterrence required
 *
 * Forbidden zones flip the logic — being inside a forbidden zone
 * triggers DETER immediately; being inside its inner deterM band
 * counts as DETER, the outer bufferM band counts as WARNING.
 */
export function calcProximity(animal: Animal, zones: Zone[]): Proximity {
  const activeZones = zones.filter((z) => z.active);
  if (activeZones.length === 0) return "SAFE";

  let bestNonForbidden: Proximity = "DETER";
  let inForbidden = false;
  let forbiddenWarn = false;

  for (const z of activeZones) {
    const inside = pointInPolygon(animal.lat, animal.lng, z.coordinates);

    if (z.type === "forbidden") {
      if (inside) {
        inForbidden = true;
        break;
      }
      const d = minDistanceToPolygonM(animal.lat, animal.lng, z.coordinates);
      if (d <= z.deterM) {
        inForbidden = true;
        break;
      }
      if (d <= z.bufferM) forbiddenWarn = true;
      continue;
    }

    // pasture | camp | buffer — favorable zones
    if (inside) return "SAFE";
    const d = minDistanceToPolygonM(animal.lat, animal.lng, z.coordinates);
    if (d <= z.bufferM && bestNonForbidden === "DETER") {
      bestNonForbidden = "WARNING";
    }
  }

  if (inForbidden) return "DETER";
  if (forbiddenWarn && bestNonForbidden === "DETER") return "WARNING";
  return bestNonForbidden;
}

export function proximityRank(p: Proximity): number {
  switch (p) {
    case "SAFE":
      return 0;
    case "WARNING":
      return 1;
    case "DETER":
      return 2;
  }
}
