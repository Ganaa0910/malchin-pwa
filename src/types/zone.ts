import { z } from "zod";

export const ZONE_TYPES = [
  "pasture",
  "camp",
  "forbidden",
  "buffer",
] as const;
export const ZoneTypeSchema = z.enum(ZONE_TYPES);
export type ZoneType = z.infer<typeof ZoneTypeSchema>;

/**
 * Polygon coordinates as [lat, lng] tuples — matches Leaflet's
 * latLng order. First/last point auto-closed by renderer.
 */
export const ZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ZoneTypeSchema,
  coordinates: z.array(z.tuple([z.number(), z.number()])),
  color: z.string().optional(),
  bufferM: z.number().default(200),
  deterM: z.number().default(50),
  active: z.boolean().default(true),
});

export type Zone = z.infer<typeof ZoneSchema>;
