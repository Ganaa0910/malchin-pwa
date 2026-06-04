"use client";

import { format } from "date-fns";
import { useAlerts } from "@/lib/db/hooks";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";
import type { Animal } from "@/types/animal";
import type { AlertType } from "@/types/alert";

const TAG: Record<AlertType, { label: string; danger?: boolean }> = {
  breach: { label: "ДАВСАН", danger: true },
  "low-battery": { label: "BAT" },
  "base-station": { label: "СҮЛЖЭЭ" },
  predator: { label: "АЮУЛ", danger: true },
  weather: { label: "ЦАГ" },
  health: { label: "ЭРҮҮЛ" },
  missing: { label: "АЛГА", danger: true },
};

export function EventLog({ animal }: { animal: Animal }) {
  const allAlerts = useAlerts();
  const events = allAlerts
    .filter(
      (a) =>
        a.animalId === animal.id ||
        (a.deviceId && a.deviceId === animal.deviceId),
    )
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="mb-2 text-sm font-bold">{mn.animal.events}</h3>
      {events.length === 0 ? (
        <p className="py-6 text-center font-mono text-sm text-mut">
          Түүх байхгүй
        </p>
      ) : (
        <div>
          {events.map((e) => {
            const tag = TAG[e.type] ?? { label: "—" };
            return (
              <div
                key={e.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 border-b border-dashed border-line py-2.5 last:border-0"
              >
                <span className="font-mono text-[11px] font-semibold text-info">
                  {format(new Date(e.createdAt), "HH:mm")}
                </span>
                <span className="min-w-0 truncate text-[13px] text-ink">
                  {e.title}
                </span>
                <span
                  className={cn(
                    "rounded-[3px] px-1.5 py-0.5 font-mono text-[9px] font-bold",
                    tag.danger
                      ? "bg-danger-soft text-danger"
                      : "bg-bg-2 text-mut",
                  )}
                >
                  {tag.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
