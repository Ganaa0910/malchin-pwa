import { AlertOctagon } from "lucide-react";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";
import type { DzudRisk } from "@/types/weather";

const RISK_STYLE: Record<
  DzudRisk,
  { bg: string; fg: string; dot: string; level: number }
> = {
  low: { bg: "bg-success", fg: "text-success-foreground", dot: "bg-success-foreground", level: 1 },
  moderate: { bg: "bg-muted", fg: "text-foreground", dot: "bg-muted-foreground", level: 2 },
  elevated: { bg: "bg-warning", fg: "text-warning-foreground", dot: "bg-warning-foreground", level: 3 },
  high: { bg: "bg-destructive", fg: "text-destructive-foreground", dot: "bg-destructive-foreground", level: 4 },
  extreme: { bg: "bg-destructive", fg: "text-destructive-foreground", dot: "bg-destructive-foreground", level: 5 },
};

export function DzudRiskCard({
  risk,
  factors,
}: {
  risk: DzudRisk;
  factors: string[];
}) {
  const s = RISK_STYLE[risk];
  return (
    <article
      className={cn("rounded-md border-card p-4 space-y-3", s.bg, s.fg)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="size-5" aria-hidden />
          <p className="text-xs uppercase tracking-widest">{mn.dzud.label}</p>
        </div>
        <p className="font-display text-2xl leading-none">{mn.dzud[risk]}</p>
      </header>

      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-opacity",
              i <= s.level ? s.dot : "opacity-25 bg-current",
            )}
          />
        ))}
      </div>

      <ul className="space-y-1.5">
        {factors.map((f) => (
          <li key={f} className="text-sm flex gap-2 items-start">
            <span aria-hidden className="mt-1.5 size-1.5 rounded-full bg-current shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
