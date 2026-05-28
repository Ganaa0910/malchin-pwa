"use client";

import { useMemo } from "react";
import type { Animal } from "@/types/animal";

const TIERS = [
  { key: "total", label: "Бүгд" },
  { key: "warning", label: "Анхаар" },
  { key: "danger", label: "Гарсан" },
  { key: "offline", label: "Холбоогүй" },
] as const;

export function StatusStrip({ animals }: { animals: Animal[] }) {
  const counts = useMemo(() => {
    const c = { total: animals.length, warning: 0, danger: 0, offline: 0 };
    for (const a of animals) {
      if (a.status === "warning") c.warning++;
      else if (a.status === "danger") c.danger++;
      else if (a.status === "offline") c.offline++;
    }
    return c;
  }, [animals]);

  return (
    <div className="grid grid-cols-4 gap-2">
      {TIERS.map(({ key, label }) => {
        const n = counts[key];
        return (
          <div
            key={key}
            className="rounded-lg border bg-card text-card-foreground px-3 py-2.5"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tracking-tight mt-1 tabular-nums">
              {n}
            </p>
          </div>
        );
      })}
    </div>
  );
}
