import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import type { Proximity } from "@/types/animal";

const STYLES: Record<Proximity, string> = {
  SAFE: "bg-success text-success-foreground",
  WARNING: "bg-warning text-warning-foreground",
  DETER: "bg-destructive text-destructive-foreground",
};

export function ProximityBadge({
  value,
  className,
}: {
  value: Proximity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "text-xs font-semibold uppercase tracking-tight",
        STYLES[value],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-80" />
      {mn.proximity[value]}
    </span>
  );
}
