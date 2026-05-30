"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import type { Animal, AnimalStatus } from "@/types/animal";
import { mn } from "@/lib/i18n/mn";
import { timeAgoMnShort } from "@/lib/time";
import { cn } from "@/lib/utils";

const SEVERITY: Record<AnimalStatus, number> = {
  danger: 0,
  warning: 1,
  offline: 2,
  safe: 3,
};

const STATUS_DOT: Record<AnimalStatus, string> = {
  safe: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  offline: "bg-muted-foreground",
};

const STATUS_LABEL: Record<AnimalStatus, string> = {
  safe: mn.status.safe,
  warning: mn.status.warning,
  danger: mn.status.danger,
  offline: mn.status.offline,
};

export function UrgentRail({
  animals,
  selectedId,
  onSelect,
}: {
  animals: Animal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const urgent = useMemo(
    () =>
      animals
        .filter((a) => a.status !== "safe")
        .sort((a, b) => {
          const s = SEVERITY[a.status] - SEVERITY[b.status];
          if (s !== 0) return s;
          return a.distanceFromBaseM - b.distanceFromBaseM;
        })
        .slice(0, 24),
    [animals],
  );

  if (urgent.length === 0) return null;

  return (
    <div
      aria-label="Анхаар хэрэгтэй мал"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-20",
        // Mobile clears the bottom nav; desktop has none, so sit near the bottom.
        "bottom-[calc(env(safe-area-inset-bottom)+84px)] md:bottom-4",
      )}
    >
      <ul
        className="pointer-events-auto flex gap-2.5 px-4 pb-3 overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {urgent.map((a) => (
          <li key={a.id} className="snap-start shrink-0">
            <UrgentCard
              animal={a}
              active={selectedId === a.id}
              onClick={() => onSelect(a.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function UrgentCard({
  animal,
  active,
  onClick,
}: {
  animal: Animal;
  active: boolean;
  onClick: () => void;
}) {
  const label = animal.name ?? animal.id;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-[244px] text-left rounded-xl border bg-background/95 backdrop-blur",
        "shadow-sm px-3.5 py-3 transition-all",
        "active:scale-[0.98] hover:bg-background",
        active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className={cn("size-2 rounded-full shrink-0", STATUS_DOT[animal.status])}
          />
          <span className="text-sm font-semibold truncate">{label}</span>
          {animal.name && (
            <span className="text-[11px] text-muted-foreground font-mono shrink-0">
              {animal.id}
            </span>
          )}
        </div>
        <ChevronRight
          className="size-3.5 text-muted-foreground shrink-0"
          aria-hidden
        />
      </div>

      <p className="text-xs mt-1.5 text-muted-foreground truncate">
        {STATUS_LABEL[animal.status]} · {mn.species[animal.species]}
      </p>

      <div className="flex items-center gap-3 mt-2 text-[11px] tabular-nums text-muted-foreground">
        <span>{(animal.distanceFromBaseM / 1000).toFixed(1)} км</span>
        <span aria-hidden>·</span>
        <span>{timeAgoMnShort(animal.lastSeenAt)}</span>
      </div>
    </button>
  );
}
