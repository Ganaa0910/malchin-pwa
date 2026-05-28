import { z } from "zod";

export const SPECIES = ["хонь", "ямаа", "үхэр", "морь"] as const;
export const SpeciesSchema = z.enum(SPECIES);
export type Species = z.infer<typeof SpeciesSchema>;

export const PROXIMITY = ["SAFE", "WARNING", "DETER"] as const;
export const ProximitySchema = z.enum(PROXIMITY);
export type Proximity = z.infer<typeof ProximitySchema>;

export const STATUS = ["safe", "warning", "danger", "offline"] as const;
export const StatusSchema = z.enum(STATUS);
export type AnimalStatus = z.infer<typeof StatusSchema>;

export const HEALTH_FLAGS = [
  "lame",
  "sick",
  "pregnant",
  "newborn",
  "wounded",
] as const;
export const HealthFlagSchema = z.enum(HEALTH_FLAGS);

export const AnimalSchema = z.object({
  id: z.string(),
  tag: z.string(),
  name: z.string().nullable(),
  species: SpeciesSchema,
  breed: z.string().optional(),
  age: z.number().int().min(0).max(25),
  sex: z.enum(["male", "female"]),
  weightKg: z.number().optional(),
  color: z.string().optional(),

  ownerId: z.string(),
  herdId: z.string(),
  deviceId: z.string().nullable(),

  lat: z.number(),
  lng: z.number(),
  altitudeM: z.number().optional(),
  lastSeenAt: z.string(),

  status: StatusSchema,
  proximity: ProximitySchema,
  speedKmh: z.number().min(0),
  distanceFromBaseM: z.number(),

  healthFlags: z.array(HealthFlagSchema).default([]),
});

export type Animal = z.infer<typeof AnimalSchema>;
