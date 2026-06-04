import type { DailyForecast, Condition } from "@/types/weather";

const COND_EMOJI: Record<Condition, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rain: "🌧",
  snow: "❄️",
  blizzard: "🌨",
  windy: "💨",
};

const WEEKDAY_MN = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export function ForecastStrip({ days }: { days: DailyForecast[] }) {
  return (
    <div
      role="list"
      aria-label="7 хоногийн мэдээ"
      className="grid grid-cols-7 gap-1.5"
    >
      {days.slice(0, 7).map((d) => {
        const dow = WEEKDAY_MN[new Date(d.date).getDay()];
        return (
          <div
            key={d.date}
            role="listitem"
            className="rounded-[9px] border border-line bg-bg-2 px-1 py-2.5 text-center"
          >
            <div className="font-mono text-[9px] uppercase tracking-wide text-mut">
              {dow}
            </div>
            <div className="my-1.5 text-[22px] leading-none">
              {COND_EMOJI[d.conditions]}
            </div>
            <div className="font-mono text-[13px] font-bold leading-none">
              {Math.round(d.tempMaxC)}°
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-mut">
              {Math.round(d.tempMinC)}°
            </div>
          </div>
        );
      })}
    </div>
  );
}
