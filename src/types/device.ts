import { z } from "zod";

export const DeviceTypeSchema = z.enum(["collar", "ear-tag", "base-station"]);

export const DeviceSchema = z.object({
  id: z.string(),
  serial: z.string(),
  type: DeviceTypeSchema,
  animalId: z.string().nullable(),
  battery: z.number().min(0).max(100),
  signal: z.number().min(0).max(100),
  firmwareVersion: z.string(),
  lastPingAt: z.string(),
  online: z.boolean(),
});

export type Device = z.infer<typeof DeviceSchema>;
