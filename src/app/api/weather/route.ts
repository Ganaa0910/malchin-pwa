import { NextResponse } from "next/server";
import {
  fetchWeatherNextWeather,
  isWeatherNextConfigured,
} from "@/lib/weather/weathernext";
import { fetchOpenMeteoWeather } from "@/lib/weather/openmeteo";
import type { Weather } from "@/types/weather";

// BigQuery client needs Node APIs (not edge).
export const runtime = "nodejs";

// Batsumber, Töv — default location for this herd.
const DEFAULT = { lat: 48.3656312, lng: 106.7407558, name: "Төв, Батсүмбэр" };

/**
 * GET /api/weather?lat=&lng=&name=
 * Returns a Weather object. Source priority:
 *   1. WeatherNext 2 (BigQuery) when configured,
 *   2. Open-Meteo (free, no key) as a live fallback,
 *   3. otherwise 503 → client falls back to seeded/offline weather.
 * The chosen provider is reported in the `X-Weather-Source` header.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat") ?? DEFAULT.lat);
  const lng = Number(searchParams.get("lng") ?? DEFAULT.lng);
  const name = searchParams.get("name") ?? DEFAULT.name;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid_coords" }, { status: 400 });
  }

  let weather: Weather | null = null;
  let source = "open-meteo";

  if (isWeatherNextConfigured()) {
    try {
      weather = await fetchWeatherNextWeather(lat, lng, name);
      source = "weathernext";
    } catch (err) {
      console.error("[weathernext] query failed, falling back to open-meteo:", err);
    }
  }

  if (!weather) {
    try {
      weather = await fetchOpenMeteoWeather(lat, lng, name);
      source = "open-meteo";
    } catch (err) {
      console.error("[open-meteo] fetch failed:", err);
      return NextResponse.json({ error: "all_providers_failed" }, { status: 503 });
    }
  }

  return NextResponse.json(weather, {
    headers: {
      "X-Weather-Source": source,
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
