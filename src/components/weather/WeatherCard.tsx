"use client";

import { Sun, Cloud, CloudRain, CloudSnow, Snowflake, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { mn } from "@/lib/i18n/mn";
import type { Weather, Condition } from "@/types/weather";

const COND_ICON: Record<Condition, LucideIcon> = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  blizzard: Snowflake,
  windy: Wind,
};

export function WeatherCard({ weather }: { weather: Weather }) {
  const Icon = COND_ICON[weather.currentConditions];
  return (
    <article
      className="rounded-md border bg-card text-card-foreground p-4"
      
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {weather.locationName}
          </p>
          <p className="text-5xl leading-none mt-1">
            {Math.round(weather.currentTempC)}°
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {mn.weather.conditions[weather.currentConditions]}
          </p>
        </div>
        <Icon className="size-16 text-primary" aria-hidden />
      </div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mt-3">
        Шинэчилсэн {format(new Date(weather.updatedAt), "HH:mm")}
      </p>
    </article>
  );
}
