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
      aria-label="15 хоногийн мэдээ"
      className="flex gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {days.slice(0, 15).map((d) => {
        const date = new Date(d.date);
        const dow = WEEKDAY_MN[date.getDay()];
        return (
          <div
            key={d.date}
            role="listitem"
            className="w-[52px] shrink-0 rounded-[9px] border border-line bg-bg-2 px-1 py-2.5 text-center"
          >
            <div className="font-mono text-[9px] uppercase tracking-wide text-mut">
              {dow}
            </div>
            <div className="font-mono text-[10px] leading-none text-mut">
              {date.getDate()}
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
