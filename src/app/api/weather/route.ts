import { NextResponse } from "next/server";
import {
  fetchWeatherNextWeather,
  isWeatherNextConfigured,
} from "@/lib/weather/weathernext";

// BigQuery client needs Node APIs (not edge).
export const runtime = "nodejs";

// Batsumber, Töv — default location for this herd.
const DEFAULT = { lat: 48.3656312, lng: 106.7407558, name: "Төв, Батсүмбэр" };

/**
 * GET /api/weather?lat=&lng=&name=
 * Returns a Weather object sourced from WeatherNext 2 (BigQuery).
 * If WeatherNext isn't configured or the query fails, returns 503 so the
 * client falls back to the seeded/offline weather.
 */
export async function GET(request: Request) {
  if (!isWeatherNextConfigured()) {
    return NextResponse.json(
      { error: "weathernext_not_configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat") ?? DEFAULT.lat);
  const lng = Number(searchParams.get("lng") ?? DEFAULT.lng);
  const name = searchParams.get("name") ?? DEFAULT.name;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid_coords" }, { status: 400 });
  }

  try {
    const weather = await fetchWeatherNextWeather(lat, lng, name);
    return NextResponse.json(weather, {
      headers: {
        // WeatherNext init times update every 6h; cache at the edge for 30 min.
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[weathernext] query failed:", err);
    return NextResponse.json({ error: "weathernext_query_failed" }, { status: 503 });
  }
}
