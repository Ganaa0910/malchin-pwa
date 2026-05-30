"use client";

import { useEffect, useState } from "react";
import { useWeather } from "@/lib/db/hooks";
import type { Weather } from "@/types/weather";

export type WeatherSource = "weathernext" | "offline" | "loading";

/**
 * Offline-first weather:
 *  - Renders the seeded/cached weather immediately (works offline).
 *  - Tries WeatherNext 2 via /api/weather; on success, swaps in the live data.
 *  - On any failure (not configured, offline, query error) keeps the seed.
 */
export function useLiveWeather(): { weather: Weather | undefined; source: WeatherSource } {
  const seed = useWeather();
  const [live, setLive] = useState<Weather | null>(null);
  const [source, setSource] = useState<WeatherSource>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather", { headers: { accept: "application/json" } })
      .then((res) => (res.ok ? (res.json() as Promise<Weather>) : null))
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setLive(data);
          setSource("weathernext");
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

  return { weather: live ?? seed, source: live ? "weathernext" : source };
}
