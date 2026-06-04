"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Battery,
  WifiOff,
  AlertTriangle,
  CloudSnow,
  Activity,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAlerts } from "@/lib/db/hooks";
import { useAppStore } from "@/lib/store/useAppStore";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";
import { timeAgoMn } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Alert, AlertType, AlertPriority } from "@/types/alert";

const TYPE_ICON: Record<AlertType, LucideIcon> = {
  breach: ShieldAlert,
  "low-battery": Battery,
  "base-station": WifiOff,
  predator: AlertTriangle,
  weather: CloudSnow,
  health: Activity,
  missing: Wifi,
};

const TYPE_LABEL: Record<AlertType, string> = {
  breach: "Хил",
  "low-battery": "Батарей",
  "base-station": "Сүлжээ",
  predator: "Махчин",
  weather: "Цаг агаар",
  health: "Эрүүл",
  missing: "Алга",
};

type Group = "high" | "medium" | "info";

const GROUP_META: Record<
  Group,
  { label: string; border: string; pfx: string }
> = {
  high: {
    label: mn.alerts.groupHigh,
    border: "border-l-danger",
    pfx: "bg-danger-soft text-danger",
  },
  medium: {
    label: mn.alerts.groupMedium,
    border: "border-l-amber",
    pfx: "bg-amber-soft text-amber",
  },
  info: {
    label: mn.alerts.groupInfo,
    border: "border-l-info",
    pfx: "bg-info-soft text-info",
  },
};

const GROUP_ORDER: Group[] = ["high", "medium", "info"];

function groupOf(p: AlertPriority): Group {
  if (p === "critical" || p === "high") return "high";
  if (p === "medium" || p === "low") return "medium";
  return "info";
}

export function AlertsList() {
  const alerts = useAlerts();
  const showBreach = useAppStore((s) => s.showBreach);
  const [filter, setFilter] = useState<"all" | AlertType>("all");

  const newCount = alerts.filter((a) => !a.acknowledged).length;

  const typeChips = useMemo(() => {
    const present = new Set(alerts.map((a) => a.type));
    return (Object.keys(TYPE_LABEL) as AlertType[]).filter((t) =>
      present.has(t),
    );
  }, [alerts]);

  const groups = useMemo(() => {
    const matched = alerts.filter((a) => filter === "all" || a.type === filter);
    return GROUP_ORDER.map((g) => ({
      group: g,
      items: matched
        .filter((a) => groupOf(a.priority) === g)
        .sort((a, b) => {
          const ack = Number(a.acknowledged) - Number(b.acknowledged);
          if (ack !== 0) return ack;
          return b.createdAt.localeCompare(a.createdAt);
        }),
    })).filter((x) => x.items.length > 0);
  }, [alerts, filter]);

  return (
    <div className="px-4 pb-nav pt-4 md:px-6 md:pt-5">
      {/* Page header */}
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <h1 className="text-[26px] font-bold leading-none tracking-tight">
          {mn.alerts.title}
        </h1>
        <span className="font-mono text-xs text-mut">
          {newCount} {mn.alerts.newCount} · {mn.alerts.recent}
        </span>
      </div>

      {/* Type filter chips */}
      <div
        className="-mx-4 mb-3.5 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
        style={{ scrollbarWidth: "none" }}
      >
        <Chip
          label={mn.alerts.filterAll}
          count={alerts.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {typeChips.map((t) => (
          <Chip
            key={t}
            label={TYPE_LABEL[t]}
            count={alerts.filter((a) => a.type === t).length}
            active={filter === t}
            onClick={() => setFilter(t)}
          />
        ))}
      </div>

      {/* Grouped alerts */}
      {groups.length === 0 ? (
        <p className="py-16 text-center font-mono text-sm text-mut">
          {mn.alerts.empty}
        </p>
      ) : (
        groups.map(({ group, items }) => (
          <div key={group}>
            <div className="mb-2 mt-3.5 flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-mut-2">
              {GROUP_META[group].label}
              <span className="rounded-[3px] bg-line px-1.5 py-px font-bold text-ink-2">
                {items.length}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <ul className="space-y-2">
              {items.map((a) => (
                <AlertItem key={a.id} alert={a} onBreach={showBreach} />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] border px-3 font-mono text-[11px] font-semibold transition-colors",
        active
          ? "border-ink bg-ink text-bg"
          : "border-line bg-surface text-ink-2 hover:border-line-2",
      )}
    >
      {label}
      <span className="text-[10px] opacity-70">{count}</span>
    </button>
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
  const meta = GROUP_META[groupOf(alert.priority)];
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
        "grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-[10px] border border-l-[3px] border-line bg-surface px-4 py-3.5",
        alert.acknowledged ? "border-l-line opacity-60" : meta.border,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-9 items-center justify-center rounded-lg [&_svg]:size-[18px]",
          alert.acknowledged ? "bg-bg-2 text-mut" : meta.pfx,
        )}
      >
        <Icon />
      </span>

      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{alert.title}</div>
        <div className="mt-0.5 line-clamp-2 font-mono text-[11px] text-mut">
          {alert.message}
        </div>
        <div className="mt-1 font-mono text-[11px] text-mut-2">
          {timeAgoMn(alert.createdAt)}
        </div>
      </div>

      {!alert.acknowledged && (
        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row">
          <button
            type="button"
            onClick={handleAck}
            className="rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-[11px] font-bold text-ink-2 transition-colors hover:border-line-2"
          >
            {mn.alerts.acknowledge}
          </button>
          {isBreach ? (
            <button
              type="button"
              onClick={() => onBreach(alert.id)}
              className="rounded-md bg-ink px-3 py-1.5 font-mono text-[11px] font-bold text-bg"
            >
              {mn.alerts.view}
            </button>
          ) : (
            alert.animalId && (
              <Link
                href={`/herd/${alert.animalId}`}
                className="rounded-md bg-ink px-3 py-1.5 font-mono text-[11px] font-bold text-bg"
              >
                {mn.alerts.view}
              </Link>
            )
          )}
        </div>
      )}
    </li>
  );
}
