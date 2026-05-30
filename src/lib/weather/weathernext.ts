/**
 * WeatherNext 2 (Google DeepMind) — server-only forecast fetch via BigQuery.
 *
 * WeatherNext 2 is NOT a REST weather API. It ships as a public dataset you
 * subscribe to through BigQuery Analytics Hub, then query in your own project.
 * See: https://developers.google.com/weathernext/guides/bigquery
 *
 * Setup (you do this once):
 *  1. Fill the WeatherNext Data Request form, then in BigQuery Analytics Hub
 *     click "Add dataset to project" on the WeatherNext 2 listing. Pick a
 *     project + dataset name when subscribing.
 *  2. Create a service account with roles: BigQuery Job User + BigQuery Data
 *     Viewer. Download its JSON key.
 *  3. Set env vars (see .env.example):
 *       GOOGLE_CLOUD_PROJECT      = your billing/query project
 *       WEATHERNEXT_DATASET       = the dataset name you chose when subscribing
 *       WEATHERNEXT_TABLE         = weathernext_2_0_0_mean   (deterministic mean)
 *       GOOGLE_CLOUD_CREDENTIALS  = the service-account JSON (whole file, one line)
 *
 * The exact column names below match the documented WeatherNext schema, but
 * verify against YOUR subscribed table once — run SCHEMA_DISCOVERY_SQL (bottom
 * of this file) in the BigQuery console and adjust COLS if anything differs.
 */
import "server-only";
import { BigQuery } from "@google-cloud/bigquery";
import type { Weather, DailyForecast, Condition, DzudRisk } from "@/types/weather";

// --- Schema field names — adjust here if your dataset differs -----------------
const COLS = {
  initTime: "init_time",
  geography: "geography",
  forecast: "forecast", // ARRAY<STRUCT<...>> of per-lead-time records
  hours: "hours", // lead time in hours within each forecast struct
  temp2m: "2m_temperature", // Kelvin
  windU: "10m_u_component_of_wind", // m/s
  windV: "10m_v_component_of_wind", // m/s
  precip: "total_precipitation_6hr", // metres
  mslp: "mean_sea_level_pressure", // Pa
} as const;

export function isWeatherNextConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT &&
      process.env.WEATHERNEXT_DATASET &&
      (process.env.GOOGLE_CLOUD_CREDENTIALS ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS),
  );
}

function client(): BigQuery {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const raw = process.env.GOOGLE_CLOUD_CREDENTIALS;
  // Inline JSON creds (Vercel-friendly) take precedence; otherwise fall back to
  // GOOGLE_APPLICATION_CREDENTIALS file path / ADC.
  if (raw) {
    return new BigQuery({ projectId, credentials: JSON.parse(raw) });
  }
  return new BigQuery({ projectId });
}

function table(): string {
  const ds = process.env.WEATHERNEXT_DATASET;
  const tbl = process.env.WEATHERNEXT_TABLE ?? "weathernext_2_0_0_mean";
  const proj = process.env.GOOGLE_CLOUD_PROJECT;
  return `\`${proj}.${ds}.${tbl}\``;
}

type ForecastRow = {
  hours: number;
  validTime: { value: string } | string;
  t2m: number | null;
  u10: number | null;
  v10: number | null;
  precip: number | null;
  mslp: number | null;
};

/**
 * Pull the latest forecast for the grid cell nearest (lat, lng), flattened to
 * one row per 6-hour lead time.
 */
async function queryForecast(lat: number, lng: number): Promise<ForecastRow[]> {
  const T = table();
  const sql = `
    WITH nearest AS (
      SELECT ${COLS.initTime} AS init_time, ${COLS.forecast} AS forecast
      FROM ${T}
      WHERE ${COLS.initTime} = (SELECT MAX(${COLS.initTime}) FROM ${T})
      ORDER BY ST_DISTANCE(${COLS.geography}, ST_GEOGPOINT(@lng, @lat))
      LIMIT 1
    )
    SELECT
      f.\`${COLS.hours}\`                                       AS hours,
      TIMESTAMP_ADD(n.init_time, INTERVAL f.\`${COLS.hours}\` HOUR) AS validTime,
      f.\`${COLS.temp2m}\`                                      AS t2m,
      f.\`${COLS.windU}\`                                       AS u10,
      f.\`${COLS.windV}\`                                       AS v10,
      f.\`${COLS.precip}\`                                      AS precip,
      f.\`${COLS.mslp}\`                                        AS mslp
    FROM nearest n, UNNEST(n.forecast) AS f
    WHERE f.\`${COLS.hours}\` BETWEEN 0 AND 360
    ORDER BY hours
  `;
  const [rows] = await client().query({
    query: sql,
    params: { lat, lng },
    location: process.env.WEATHERNEXT_LOCATION ?? "US",
  });
  return rows as ForecastRow[];
}

// --- Unit + domain mapping ----------------------------------------------------
const kelvinToC = (k: number) => k - 273.15;
const msToKmh = (ms: number) => ms * 3.6;
const metresToMm = (m: number) => m * 1000;
const windSpeed = (u: number | null, v: number | null) =>
  Math.hypot(u ?? 0, v ?? 0);

function isoDate(v: ForecastRow["validTime"]): string {
  const s = typeof v === "string" ? v : v.value;
  return s.slice(0, 10); // YYYY-MM-DD
}

function condition(precipMm: number, snowCm: number, windKmh: number): Condition {
  if (snowCm >= 5) return "blizzard";
  if (snowCm > 0) return "snow";
  if (precipMm >= 1) return "rain";
  if (windKmh >= 35) return "windy";
  if (precipMm >= 0.2) return "cloudy";
  return "sunny";
}

/** Snow is approximated from precip on sub-zero days (WeatherNext 2 mean table
 *  exposes precip, not sn. ~7:1 snow:liquid ratio). */
function snowFrom(precipMm: number, tempMaxC: number): number {
  if (tempMaxC > 1) return 0;
  return Math.round(precipMm * 7 * 10) / 10;
}

function dzud(
  days: DailyForecast[],
): { risk: DzudRisk; factors: string[] } {
  const next3 = days.slice(0, 3);
  const totalSnow = next3.reduce((s, d) => s + d.snowCm, 0);
  const coldNights = next3.filter((d) => d.tempMinC <= -10).length;
  const highWind = next3.some((d) => d.windKmh >= 35);

  let score = 0;
  if (totalSnow >= 30) score += 3;
  else if (totalSnow >= 15) score += 2;
  else if (totalSnow >= 5) score += 1;
  score += coldNights;
  if (highWind) score += 1;

  const risk: DzudRisk =
    score >= 6 ? "extreme" : score >= 4 ? "high" : score >= 3 ? "elevated" : score >= 1 ? "moderate" : "low";

  const factors: string[] = [];
  if (totalSnow > 0) factors.push(`Гурван өдрийн цас ~${Math.round(totalSnow)}см`);
  const minNight = Math.min(...next3.map((d) => d.tempMinC));
  if (minNight <= 0) factors.push(`Шөнийн хүйтэн ${Math.round(minNight)}°C хүртэл`);
  if (highWind) factors.push("Хүчтэй салхи 35км/ц-ээс дээш");
  if (factors.length === 0) factors.push("Эрсдэл багатай");
  return { risk, factors };
}

/** Aggregate 6-hourly forecast rows into the app's daily Weather shape. */
function toWeather(
  rows: ForecastRow[],
  lat: number,
  lng: number,
  locationName: string,
): Weather {
  const byDay = new Map<string, ForecastRow[]>();
  for (const r of rows) {
    const day = isoDate(r.validTime);
    (byDay.get(day) ?? byDay.set(day, []).get(day)!).push(r);
  }

  const days: DailyForecast[] = [...byDay.entries()]
    .slice(0, 7)
    .map(([date, recs]) => {
      const temps = recs.map((r) => kelvinToC(r.t2m ?? 273.15));
      const tempMaxC = Math.max(...temps);
      const tempMinC = Math.min(...temps);
      const windKmh = Math.max(...recs.map((r) => msToKmh(windSpeed(r.u10, r.v10))));
      const precipMm = recs.reduce((s, r) => s + metresToMm(r.precip ?? 0), 0);
      const snowCm = snowFrom(precipMm, tempMaxC);
      return {
        date,
        tempMaxC: Math.round(tempMaxC * 10) / 10,
        tempMinC: Math.round(tempMinC * 10) / 10,
        conditions: condition(precipMm, snowCm, windKmh),
        windKmh: Math.round(windKmh * 10) / 10,
        precipMm: Math.round(precipMm * 10) / 10,
        snowCm,
      };
    });

  const now = rows[0];
  const currentTempC = Math.round(kelvinToC(now?.t2m ?? 273.15) * 10) / 10;
  const { risk, factors } = dzud(days);

  return {
    locationName,
    lat,
    lng,
    currentTempC,
    currentConditions: days[0]?.conditions ?? "cloudy",
    dzudRisk: risk,
    dzudFactors: factors,
    forecast: days,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchWeatherNextWeather(
  lat: number,
  lng: number,
  locationName: string,
): Promise<Weather> {
  const rows = await queryForecast(lat, lng);
  if (rows.length === 0) throw new Error("WeatherNext returned no rows");
  return toWeather(rows, lat, lng, locationName);
}

/**
 * Run this in the BigQuery console to confirm your table's real column names,
 * then reconcile COLS above if anything differs:
 *
 *   SELECT column_name, data_type
 *   FROM `PROJECT.DATASET`.INFORMATION_SCHEMA.COLUMNS
 *   WHERE table_name = 'weathernext_2_0_0_mean';
 */
export const SCHEMA_DISCOVERY_SQL = `
SELECT column_name, data_type
FROM \`PROJECT.DATASET\`.INFORMATION_SCHEMA.COLUMNS
WHERE table_name = 'weathernext_2_0_0_mean';
`;
