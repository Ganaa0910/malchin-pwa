import type { DailyForecast, DzudRisk } from "@/types/weather";

/**
 * Derive zud (дзуд) risk + human factors from the next 3 days of forecast.
 * Shared by every weather provider so the risk model stays consistent.
 */
export function deriveDzud(days: DailyForecast[]): {
  risk: DzudRisk;
  factors: string[];
} {
  const next3 = days.slice(0, 3);
  if (next3.length === 0) return { risk: "low", factors: ["Мэдээлэл хүрэлцэхгүй"] };

  const totalSnow = next3.reduce((s, d) => s + d.snowCm, 0);
  const coldNights = next3.filter((d) => d.tempMinC <= -10).length;
  const highWind = next3.some((d) => d.windKmh >= 35);

  let score = 0;
  if (totalSnow >= 30) score += 3;
  else if (totalSnow >= 15) score += 2;
  else if (totalSnow >= 5) score += 1;
  score += coldNights;
  if (highWind) score += 1;

  const risk: DzudRisk =
    score >= 6
      ? "extreme"
      : score >= 4
        ? "high"
        : score >= 3
          ? "elevated"
          : score >= 1
            ? "moderate"
            : "low";

  const factors: string[] = [];
  if (totalSnow > 0) factors.push(`Гурван өдрийн цас ~${Math.round(totalSnow)}см`);
  const minNight = Math.min(...next3.map((d) => d.tempMinC));
  if (minNight <= 0) factors.push(`Шөнийн хүйтэн ${Math.round(minNight)}°C хүртэл`);
  if (highWind) factors.push("Хүчтэй салхи 35км/ц-ээс дээш");
  if (factors.length === 0) factors.push("Эрсдэл багатай");
  return { risk, factors };
}
