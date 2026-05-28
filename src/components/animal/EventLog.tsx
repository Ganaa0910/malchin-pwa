"use client";

import {
  AlertTriangle,
  Battery,
  ShieldAlert,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";
import { useAlerts } from "@/lib/db/hooks";
import { mn } from "@/lib/i18n/mn";
import { timeAgoMn } from "@/lib/time";
import type { Animal } from "@/types/animal";
import type { AlertType } from "@/types/alert";

const TYPE_ICON: Record<AlertType, typeof AlertTriangle> = {
  breach: ShieldAlert,
  "low-battery": Battery,
  "base-station": WifiOff,
  predator: AlertTriangle,
  weather: AlertTriangle,
  health: Activity,
  missing: Wifi,
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

  if (events.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg px-1">{mn.animal.events}</h2>
        <p className="text-sm text-muted-foreground text-center py-6 rounded-md border bg-card">
          Түүх байхгүй
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg px-1">{mn.animal.events}</h2>
      <ul className="space-y-2">
        {events.map((e) => {
          const Icon = TYPE_ICON[e.type] ?? AlertTriangle;
          return (
            <li
              key={e.id}
              className="rounded-md border bg-card text-card-foreground p-3 flex gap-3"
              
            >
              <span
                aria-hidden
                className="size-8 shrink-0 rounded-full flex items-center justify-center bg-muted text-muted-foreground"
              >
                <Icon className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">
                  {e.title}
                </p>
                <p className="text-xs text-muted-foreground leading-tight mt-1 line-clamp-2">
                  {e.message}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-mono">
                  {timeAgoMn(e.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
