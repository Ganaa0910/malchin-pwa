import { z } from "zod";

export const CONDITIONS = [
  "sunny",
  "cloudy",
  "rain",
  "snow",
  "blizzard",
  "windy",
] as const;
export const ConditionSchema = z.enum(CONDITIONS);
export type Condition = z.infer<typeof ConditionSchema>;

export const DZUD_RISK = [
  "low",
  "moderate",
  "elevated",
  "high",
  "extreme",
] as const;
export const DzudRiskSchema = z.enum(DZUD_RISK);
export type DzudRisk = z.infer<typeof DzudRiskSchema>;

export const DailyForecastSchema = z.object({
  date: z.string(),
  tempMaxC: z.number(),
  tempMinC: z.number(),
  conditions: ConditionSchema,
  windKmh: z.number(),
  precipMm: z.number(),
  snowCm: z.number().default(0),
});
export type DailyForecast = z.infer<typeof DailyForecastSchema>;

export const WeatherSchema = z.object({
  locationName: z.string(),
  lat: z.number(),
  lng: z.number(),
  currentTempC: z.number(),
  currentConditions: ConditionSchema,
  dzudRisk: DzudRiskSchema,
  dzudFactors: z.array(z.string()),
  forecast: z.array(DailyForecastSchema),
  updatedAt: z.string(),
});
export type Weather = z.infer<typeof WeatherSchema>;
