"use client";

import { useWeather } from "@/lib/db/hooks";
import { WeatherCard } from "./WeatherCard";
import { DzudRiskCard } from "./DzudRiskCard";
import { ForecastStrip } from "./ForecastStrip";
import { DeviceAlertsPanel } from "@/components/devices/DeviceAlertsPanel";
import { mn } from "@/lib/i18n/mn";

export function WeatherScreen() {
  const weather = useWeather();
  if (!weather) {
    return (
      <p className="px-5 py-12 text-center text-sm text-muted-foreground">
        {mn.generic.loading}
      </p>
    );
  }
  return (
    <div className="px-4 py-3 pb-nav space-y-4">
      <WeatherCard weather={weather} />
      <DzudRiskCard risk={weather.dzudRisk} factors={weather.dzudFactors} />
      <section>
        <h2 className="text-lg mb-2 px-1">
          {mn.weather.forecastDays}
        </h2>
        <ForecastStrip days={weather.forecast} />
      </section>
      <DeviceAlertsPanel />
    </div>
  );
}
