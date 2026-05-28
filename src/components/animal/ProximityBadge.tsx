import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import type { Proximity } from "@/types/animal";

const STYLES: Record<Proximity, string> = {
  SAFE: "border-transparent bg-muted text-muted-foreground",
  WARNING: "border-warning/30 bg-warning/10 text-warning-foreground",
  DETER: "border-destructive/30 bg-destructive/10 text-destructive",
};

const DOT: Record<Proximity, string> = {
  SAFE: "bg-muted-foreground",
  WARNING: "bg-warning",
  DETER: "bg-destructive",
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
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border",
        "text-xs font-medium",
        STYLES[value],
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[value])} />
      {mn.proximity[value]}
    </span>
  );
}
