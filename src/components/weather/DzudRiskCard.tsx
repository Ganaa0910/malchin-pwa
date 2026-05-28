import { AlertOctagon } from "lucide-react";
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

const RISK_TEXT: Record<DzudRisk, string> = {
  low: "text-muted-foreground",
  moderate: "text-foreground",
  elevated: "text-warning",
  high: "text-destructive",
  extreme: "text-destructive",
};

const BAR_COLOR: Record<DzudRisk, string> = {
  low: "bg-muted-foreground",
  moderate: "bg-foreground",
  elevated: "bg-warning",
  high: "bg-destructive",
  extreme: "bg-destructive",
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
    <article className="rounded-lg border bg-card text-card-foreground p-4 space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertOctagon className="size-4" aria-hidden />
          <p className="text-sm">{mn.dzud.label}</p>
        </div>
        <p className={cn("text-sm font-semibold", RISK_TEXT[risk])}>
          {mn.dzud[risk]}
        </p>
      </header>

      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= level ? BAR_COLOR[risk] : "bg-muted",
            )}
          />
        ))}
      </div>

      <ul className="space-y-1.5">
        {factors.map((f) => (
          <li
            key={f}
            className="text-sm text-muted-foreground flex gap-2 items-start"
          >
            <span
              aria-hidden
              className="mt-1.5 size-1 rounded-full bg-muted-foreground shrink-0"
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
