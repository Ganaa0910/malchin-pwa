import { z } from "zod";

export const OwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  aimag: z.string(),
  sum: z.string(),
  bagh: z.string().optional(),
  baseLat: z.number(),
  baseLng: z.number(),
  baseName: z.string(),
});

export type Owner = z.infer<typeof OwnerSchema>;

export const HerdSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  species: z.string(),
  count: z.number().int(),
});
export type Herd = z.infer<typeof HerdSchema>;
