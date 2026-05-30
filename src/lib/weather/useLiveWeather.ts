"use client";

import { useEffect, useState } from "react";
import { useWeather } from "@/lib/db/hooks";
import type { Weather } from "@/types/weather";

export type WeatherSource = "weathernext" | "open-meteo" | "offline" | "loading";

/**
 * Offline-first weather:
 *  - Renders the seeded/cached weather immediately (works offline).
 *  - Tries /api/weather (WeatherNext 2 → Open-Meteo); swaps in live data.
 *  - On any failure keeps the seed and reports "offline".
 * The live provider is taken from the X-Weather-Source response header.
 */
export function useLiveWeather(): { weather: Weather | undefined; source: WeatherSource } {
  const seed = useWeather();
  const [live, setLive] = useState<Weather | null>(null);
  const [source, setSource] = useState<WeatherSource>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather", { headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) return null;
        const hdr = res.headers.get("x-weather-source");
        const data = (await res.json()) as Weather;
        return { data, hdr };
      })
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setLive(result.data);
          setSource(result.hdr === "weathernext" ? "weathernext" : "open-meteo");
        } else {
          setSource("offline");
        }
      })
      .catch(() => {
        if (!cancelled) setSource("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { weather: live ?? seed, source };
}
