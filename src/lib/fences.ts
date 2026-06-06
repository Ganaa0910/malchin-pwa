import type { Zone } from "@/types/zone";
import type { CustomPolygon } from "@/types/polygon";
import type { Geofence } from "@/lib/api";
import { parseWktPolygon } from "@/lib/wkt";

/** safe = animals should stay INSIDE (green) · danger = animals should stay OUT (red). */
export type FenceKind = "safe" | "danger";

export interface EvalFence {
  id: string;
  name: string;
  kind: FenceKind;
  coordinates: [number, number][];
}

/** Pasture/camp/buffer zones are safe areas; `forbidden` zones are danger areas. */
export function zoneKind(z: Zone): FenceKind {
  return z.type === "forbidden" ? "danger" : "safe";
}

/**
 * Unify the three fence sources into one list with a safe/danger classification.
 * Only active fences are returned. Traccar-imported geofences (the red ones) are
 * treated as danger areas.
 */
export function buildFences(
  zones: Zone[],
  polygons: CustomPolygon[],
  geofences: Geofence[],
): EvalFence[] {
  const out: EvalFence[] = [];

  for (const z of zones) {
    if (z.active === false) continue;
    if (z.coordinates.length < 3) continue;
    out.push({ id: z.id, name: z.name, kind: zoneKind(z), coordinates: z.coordinates });
  }

  for (const p of polygons) {
    if (p.active === false) continue;
    if (p.coordinates.length < 3) continue;
    out.push({ id: p.id, name: p.name, kind: p.kind ?? "safe", coordinates: p.coordinates });
  }

  for (const g of geofences) {
    const ring = parseWktPolygon(g.area).map((c) => [c.lat, c.lng] as [number, number]);
    if (ring.length < 3) continue;
    out.push({ id: `geo-${g.id}`, name: g.name, kind: "danger", coordinates: ring });
  }

  return out;
}

export function dangerFences(fences: EvalFence[]): EvalFence[] {
  return fences.filter((f) => f.kind === "danger");
}
