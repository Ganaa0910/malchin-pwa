"use client";

import { useMemo } from "react";
import type { Animal, AnimalStatus } from "@/types/animal";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";

const SEVERITY: Record<AnimalStatus, number> = {
  danger: 0,
  warning: 1,
  offline: 2,
  safe: 3,
};

const STATUS_DOT: Record<AnimalStatus, string> = {
  safe: "bg-success",
  warning: "bg-amber",
  danger: "bg-danger",
  offline: "bg-mut-2",
};

const STATUS_BORDER: Record<AnimalStatus, string> = {
  safe: "border-l-success",
  warning: "border-l-amber",
  danger: "border-l-danger",
  offline: "border-l-mut-2",
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
      className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+86px)] z-20 md:bottom-3"
    >
      <div
        className="flex gap-2.5 overflow-x-auto rounded-xl border border-line bg-bg/95 p-2.5 shadow-lg backdrop-blur"
        style={{ scrollbarWidth: "none" }}
      >
        {urgent.map((a) => (
          <UrgentCard
            key={a.id}
            animal={a}
            active={selectedId === a.id}
            onClick={() => onSelect(a.id)}
          />
        ))}
      </div>
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
        "grid w-[240px] shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-[10px] border border-l-[3px] border-line bg-surface px-3 py-2.5 text-left transition-all hover:border-line-2 active:scale-[0.98]",
        STATUS_BORDER[animal.status],
        active && "ring-2 ring-ink ring-offset-1 ring-offset-bg",
      )}
    >
      <span
        aria-hidden
        className={cn("size-2.5 rounded-full", STATUS_DOT[animal.status])}
      />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-[13px] font-bold">{label}</span>
          {animal.name && (
            <span className="shrink-0 font-mono text-[10px] text-mut">
              {animal.id}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] text-mut">
          {STATUS_LABEL[animal.status]} · {mn.species[animal.species]}
        </div>
      </div>
      <div className="text-right font-mono text-[13px] font-bold leading-none tabular-nums">
        {(animal.distanceFromBaseM / 1000).toFixed(1)}
        <span className="ml-0.5 text-[9px] font-medium text-mut">км</span>
      </div>
    </button>
  );
}
