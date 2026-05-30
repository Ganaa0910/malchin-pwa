import { z } from "zod";

/**
 * User-drawn custom polygon. Coordinates are [lat, lng] tuples (Leaflet order),
 * auto-closed by the renderer. Stored client-side in IndexedDB.
 */
export const CustomPolygonSchema = z.object({
  id: z.string(),
  name: z.string(),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
  color: z.string().default("#16a34a"),
  createdAt: z.string(),
});

export type CustomPolygon = z.infer<typeof CustomPolygonSchema>;
