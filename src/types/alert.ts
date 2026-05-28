import { z } from "zod";

export const ALERT_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;
export const AlertPrioritySchema = z.enum(ALERT_PRIORITIES);
export type AlertPriority = z.infer<typeof AlertPrioritySchema>;

export const ALERT_TYPES = [
  "breach",
  "low-battery",
  "base-station",
  "predator",
  "weather",
  "health",
  "missing",
] as const;
export const AlertTypeSchema = z.enum(ALERT_TYPES);
export type AlertType = z.infer<typeof AlertTypeSchema>;

export const AlertSchema = z.object({
  id: z.string(),
  type: AlertTypeSchema,
  priority: AlertPrioritySchema,
  title: z.string(),
  message: z.string(),
  animalId: z.string().nullable(),
  deviceId: z.string().nullable(),
  zoneId: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  acknowledged: z.boolean(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type Alert = z.infer<typeof AlertSchema>;
