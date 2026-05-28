"use client";

import { useMemo } from "react";
import {
  ShieldAlert,
  Battery,
  WifiOff,
  AlertTriangle,
  CloudSnow,
  Activity,
  Wifi,
  CheckCheck,
} from "lucide-react";
import { useAlerts } from "@/lib/db/hooks";
import { useAppStore } from "@/lib/store/useAppStore";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";
import { timeAgoMn } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Alert, AlertType, AlertPriority } from "@/types/alert";

const TYPE_ICON: Record<AlertType, typeof AlertTriangle> = {
  breach: ShieldAlert,
  "low-battery": Battery,
  "base-station": WifiOff,
  predator: AlertTriangle,
  weather: CloudSnow,
  health: Activity,
  missing: Wifi,
};

const PRIORITY_RANK: Record<AlertPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const PRIORITY_ICON: Record<AlertPriority, string> = {
  critical: "text-destructive",
  high: "text-warning",
  medium: "text-foreground",
  low: "text-muted-foreground",
  info: "text-muted-foreground",
};

const PRIORITY_BORDER: Record<AlertPriority, string> = {
  critical: "border-l-destructive",
  high: "border-l-warning",
  medium: "border-l-border",
  low: "border-l-border",
  info: "border-l-border",
};

export function AlertsList() {
  const alerts = useAlerts();
  const showBreach = useAppStore((s) => s.showBreach);

  const sorted = useMemo(() => {
    return alerts.slice().sort((a, b) => {
      const ack = Number(a.acknowledged) - Number(b.acknowledged);
      if (ack !== 0) return ack;
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [alerts]);

  if (sorted.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">{mn.alerts.empty}</p>
      </div>
    );
  }

  return (
    <ul className="px-4 py-3 pb-nav space-y-2">
      {sorted.map((a) => (
        <AlertItem key={a.id} alert={a} onBreach={showBreach} />
      ))}
    </ul>
  );
}

function AlertItem({
  alert,
  onBreach,
}: {
  alert: Alert;
  onBreach: (id: string) => void;
}) {
  const Icon = TYPE_ICON[alert.type] ?? AlertTriangle;
  const isBreach = alert.type === "breach" || alert.type === "predator";

  async function handleAck() {
    await getDb().alerts.update(alert.id, { acknowledged: true });
    await getDb().syncQueue.add({
      kind: "ack-alert",
      payload: { alertId: alert.id },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
  }

  return (
    <li
      className={cn(
        "rounded-md border bg-card text-card-foreground p-3 flex gap-3",
        "border-l-2",
        alert.acknowledged
          ? "opacity-60 border-l-border"
          : PRIORITY_BORDER[alert.priority],
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 mt-0.5",
          alert.acknowledged
            ? "text-muted-foreground"
            : PRIORITY_ICON[alert.priority],
        )}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{alert.title}</p>
          {alert.acknowledged && (
            <CheckCheck
              className="size-3.5 text-muted-foreground shrink-0 mt-0.5"
              aria-hidden
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
          {alert.message}
        </p>
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {timeAgoMn(alert.createdAt)}
          </span>
          {!alert.acknowledged && (
            <div className="flex gap-1.5">
              {isBreach && (
                <button
                  type="button"
                  onClick={() => onBreach(alert.id)}
                  className="text-xs font-medium px-2.5 h-7 rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Үзэх
                </button>
              )}
              <button
                type="button"
                onClick={handleAck}
                className="text-xs font-medium px-2.5 h-7 rounded-md border bg-background hover:bg-accent transition-colors"
              >
                {mn.alerts.acknowledge}
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
