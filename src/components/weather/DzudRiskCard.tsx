import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";
import type { DzudRisk } from "@/types/weather";

const LEVEL: Record<DzudRisk, number> = {
  low: 1,
  moderate: 2,
  elevated: 3,
  high: 4,
  extreme: 5,
};

const RISK: Record<DzudRisk, { badge: string; bar: string }> = {
  low: { badge: "bg-success-soft text-success", bar: "bg-success" },
  moderate: { badge: "bg-bg-2 text-ink-2", bar: "bg-ink-2" },
  elevated: { badge: "bg-amber-soft text-amber", bar: "bg-amber" },
  high: { badge: "bg-danger-soft text-danger", bar: "bg-danger" },
  extreme: { badge: "bg-danger-soft text-danger", bar: "bg-danger" },
};

export function DzudRiskCard({
  risk,
  factors,
}: {
  risk: DzudRisk;
  factors: string[];
}) {
  const level = LEVEL[risk];
  return (
    <article className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-bold">{mn.weather.riskTitle}</div>
        <span
          className={cn(
            "rounded-[5px] px-2 py-0.5 font-mono text-[11px] font-bold",
            RISK[risk].badge,
          )}
        >
          {mn.dzud[risk].toUpperCase()}
        </span>
      </div>

      <div className="flex h-1.5 gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "flex-1 rounded-full",
              i <= level ? RISK[risk].bar : "bg-bg-2",
            )}
          />
        ))}
      </div>

      {factors.map((f) => (
        <div
          key={f}
          className="flex items-start gap-1.5 font-mono text-[11px] leading-relaxed text-mut"
        >
          <span aria-hidden className="text-brand">
            •
          </span>
          <span>{f}</span>
        </div>
      ))}
    </article>
  );
}
