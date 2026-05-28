import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Snowflake,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DailyForecast, Condition } from "@/types/weather";

const COND_ICON: Record<Condition, LucideIcon> = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  blizzard: Snowflake,
  windy: Wind,
};

const WEEKDAY_MN = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export function ForecastStrip({ days }: { days: DailyForecast[] }) {
  return (
    <ul
      role="list"
      aria-label="7 хоногийн мэдээ"
      className="grid grid-cols-7 gap-1"
    >
      {days.map((d) => {
        const Icon = COND_ICON[d.conditions];
        const dow = WEEKDAY_MN[new Date(d.date).getDay()];
        return (
          <li
            key={d.date}
            className="rounded-md border-card bg-card text-card-foreground py-2 px-0.5 flex flex-col items-center gap-1"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
              {dow}
            </span>
            <Icon className="size-4 text-primary" aria-hidden />
            <span className="text-xs font-mono leading-tight">
              {Math.round(d.tempMaxC)}°
            </span>
            <span className="text-[10px] font-mono text-muted-foreground leading-tight">
              {Math.round(d.tempMinC)}°
            </span>
          </li>
        );
      })}
    </ul>
  );
}
