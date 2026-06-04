"use client";

import { useLiveWeather } from "@/lib/weather/useLiveWeather";
import { WeatherCard } from "./WeatherCard";
import { DzudRiskCard } from "./DzudRiskCard";
import { ForecastStrip } from "./ForecastStrip";
import { DeviceAlertsPanel } from "@/components/devices/DeviceAlertsPanel";
import { mn } from "@/lib/i18n/mn";

export function WeatherScreen() {
  const { weather, source } = useLiveWeather();

  const sourceLabel =
    source === "weathernext"
      ? "WeatherNext 2"
      : source === "open-meteo"
        ? "Open-Meteo"
        : "Офлайн";

  if (!weather) {
    return (
      <p className="px-4 py-16 text-center font-mono text-sm text-mut">
        {mn.generic.loading}
      </p>
    );
  }

  return (
    <div className="px-4 pb-nav pt-4 md:px-6 md:pt-5">
      {/* Page header */}
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold leading-none tracking-tight">
            {mn.nav.weather}
          </h1>
          <div className="mt-1 font-mono text-xs text-mut">
            {weather.locationName}
          </div>
        </div>
        <span className="font-mono text-xs text-mut">{sourceLabel}</span>
      </div>

      {/* Main + risk */}
      <div className="mb-3.5 grid gap-2.5 md:grid-cols-[1.4fr_1fr]">
        <WeatherCard weather={weather} />
        <DzudRiskCard risk={weather.dzudRisk} factors={weather.dzudFactors} />
      </div>

      {/* 7-day */}
      <div className="mb-3.5 rounded-xl border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-bold">{mn.weather.forecastDays}</h3>
        <ForecastStrip days={weather.forecast} />
      </div>

      {/* Device warnings */}
      <DeviceAlertsPanel />
    </div>
  );
}
