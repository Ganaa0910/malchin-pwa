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
import { formatDistanceToNow } from "date-fns";
import { useAlerts } from "@/lib/db/hooks";
import { useAppStore } from "@/lib/store/useAppStore";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";
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

const PRIORITY_STYLE: Record<AlertPriority, { ring: string; text: string }> = {
  critical: { ring: "border-destructive", text: "text-destructive" },
  high: { ring: "border-warning", text: "text-warning" },
  medium: { ring: "border-border", text: "text-foreground" },
  low: { ring: "border-border", text: "text-muted-foreground" },
  info: { ring: "border-border", text: "text-muted-foreground" },
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
      <div className="px-5 py-12 text-center">
        <p className="text-sm text-muted-foreground">{mn.alerts.empty}</p>
      </div>
    );
  }

  return (
    <ul className="px-5 py-3 space-y-2.5">
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
  const style = PRIORITY_STYLE[alert.priority];
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
        "rounded-md border-card bg-card text-card-foreground p-3 flex gap-3",
        alert.acknowledged && "opacity-60",
      )}
      style={{
        boxShadow: "var(--shadow-card)",
        borderLeft: alert.acknowledged ? undefined : `3px solid var(--${alert.priority === "critical" ? "destructive" : alert.priority === "high" ? "warning" : "muted-foreground"})`,
      }}
    >
      <span
        aria-hidden
        className={cn(
          "size-10 shrink-0 rounded-full flex items-center justify-center bg-muted",
          style.text,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{alert.title}</p>
          {alert.acknowledged && (
            <CheckCheck
              className="size-4 text-success shrink-0 mt-0.5"
              aria-hidden
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-2">
          {alert.message}
        </p>
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
          </span>
          {!alert.acknowledged && (
            <div className="flex gap-1.5">
              {isBreach && (
                <button
                  type="button"
                  onClick={() => onBreach(alert.id)}
                  className="tap text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground"
                >
                  Үзэх
                </button>
              )}
              <button
                type="button"
                onClick={handleAck}
                className="tap text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"
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
