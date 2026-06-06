import { z } from "zod";

/**
 * User-drawn custom polygon. Coordinates are [lat, lng] tuples (Leaflet order),
 * auto-closed by the renderer. Stored client-side in IndexedDB.
 */
export const CustomPolygonSchema = z.object({
  id: z.string(),
  name: z.string(),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
  color: z.string().default("#0F6E56"),
  /** safe = animals should stay inside (green) · danger = stay out (red). */
  kind: z.enum(["safe", "danger"]).default("safe"),
  /** Whether the fence is enabled (drawn on the map). Missing = active. */
  active: z.boolean().default(true),
  createdAt: z.string(),
});

export type CustomPolygon = z.infer<typeof CustomPolygonSchema>;
