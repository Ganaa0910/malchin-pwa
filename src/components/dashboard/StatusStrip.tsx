"use client";

import { useMemo } from "react";
import { Layers, AlertTriangle, ShieldAlert, WifiOff } from "lucide-react";
import type { Animal } from "@/types/animal";

const TIERS = [
  { key: "total", label: "Бүгд", Icon: Layers, color: "var(--fg)" },
  { key: "warning", label: "Анхаар", Icon: AlertTriangle, color: "var(--warning)" },
  { key: "danger", label: "Дайч", Icon: ShieldAlert, color: "var(--destructive)" },
  { key: "offline", label: "Тасарсан", Icon: WifiOff, color: "var(--muted-foreground)" },
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
      {TIERS.map(({ key, label, Icon, color }) => {
        const n = counts[key];
        return (
          <div
            key={key}
            className="rounded-md border-card bg-card text-card-foreground px-2 py-2"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-1.5">
              <Icon className="size-3.5" style={{ color }} aria-hidden />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
            </div>
            <div className="font-display text-2xl leading-none mt-1" style={{ color }}>
              {n}
            </div>
          </div>
        );
      })}
    </div>
  );
}
