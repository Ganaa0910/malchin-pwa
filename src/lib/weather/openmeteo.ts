/**
 * Open-Meteo weather provider — free, no API key, CORS-open.
 * Used as a live fallback until WeatherNext 2 access is approved/configured.
 * Docs: https://open-meteo.com/en/docs
 */
import type { Weather, DailyForecast, Condition } from "@/types/weather";
import { deriveDzud } from "./derive";

type OpenMeteoResponse = {
  current?: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    wind_speed_10m_max: number[];
    precipitation_sum: number[];
    snowfall_sum: number[];
  };
};

/** Map a WMO weather code (+ snow/wind context) to the app's Condition enum. */
function condition(code: number, snowCm: number, windKmh: number): Condition {
  if (code >= 71 && code <= 77) return snowCm >= 5 && windKmh >= 35 ? "blizzard" : "snow";
  if (code === 85 || code === 86) return snowCm >= 5 && windKmh >= 35 ? "blizzard" : "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 95) return "rain"; // thunderstorm
  if (code === 45 || code === 48) return "cloudy"; // fog
  if (code === 2 || code === 3) return "cloudy";
  if (windKmh >= 35) return "windy";
  return "sunny"; // 0–1 clear / mainly clear
}

export async function fetchOpenMeteoWeather(
  lat: number,
  lng: number,
  locationName: string,
): Promise<Weather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum,snowfall_sum",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    // Open-Meteo updates ~hourly; let the platform cache briefly.
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  if (!data.daily || !data.current) throw new Error("Open-Meteo: malformed response");

  const d = data.daily;
  const forecast: DailyForecast[] = d.time.map((date, i) => {
    const windKmh = Math.round((d.wind_speed_10m_max[i] ?? 0) * 10) / 10;
    const snowCm = Math.round((d.snowfall_sum[i] ?? 0) * 10) / 10;
    const precipMm = Math.round((d.precipitation_sum[i] ?? 0) * 10) / 10;
    return {
      date,
      tempMaxC: Math.round((d.temperature_2m_max[i] ?? 0) * 10) / 10,
      tempMinC: Math.round((d.temperature_2m_min[i] ?? 0) * 10) / 10,
      conditions: condition(d.weather_code[i] ?? 0, snowCm, windKmh),
      windKmh,
      precipMm,
      snowCm,
    };
  });

  const { risk, factors } = deriveDzud(forecast);

  return {
    locationName,
    lat,
    lng,
    currentTempC: Math.round(data.current.temperature_2m * 10) / 10,
    currentConditions: condition(
      data.current.weather_code,
      forecast[0]?.snowCm ?? 0,
      Math.round(data.current.wind_speed_10m * 10) / 10,
    ),
    dzudRisk: risk,
    dzudFactors: factors,
    forecast,
    updatedAt: new Date().toISOString(),
  };
}
