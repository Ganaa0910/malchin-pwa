import { format } from "date-fns";
import { mn } from "@/lib/i18n/mn";
import type { Weather, Condition } from "@/types/weather";

const COND_EMOJI: Record<Condition, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rain: "🌧",
  snow: "❄️",
  blizzard: "🌨",
  windy: "💨",
};

export function WeatherCard({ weather }: { weather: Weather }) {
  const windKmh = weather.forecast[0]?.windKmh;
  const windMs = windKmh != null ? Math.round(windKmh / 3.6) : null;

  return (
    <article className="rounded-xl border border-line bg-surface p-5">
      <div className="font-mono text-[11px] uppercase tracking-wide text-mut">
        {weather.locationName}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-6xl font-bold leading-none">
            {Math.round(weather.currentTempC)}°
          </div>
          <div className="mt-1.5 text-[15px] text-ink-2">
            {mn.weather.conditions[weather.currentConditions]}
            {windMs != null && ` · салхи ${windMs}${mn.weather.windMs}`}
          </div>
        </div>
        <div className="flex size-[74px] shrink-0 items-center justify-center rounded-[18px] bg-brand-soft text-[38px]">
          {COND_EMOJI[weather.currentConditions]}
        </div>
      </div>
      <div className="mt-3.5 font-mono text-[10px] uppercase tracking-wide text-mut-2">
        // {mn.weather.updated} {format(new Date(weather.updatedAt), "HH:mm")}
      </div>
    </article>
  );
}
