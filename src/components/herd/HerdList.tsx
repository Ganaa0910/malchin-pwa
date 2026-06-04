"use client";

import Link from "next/link";
import { useMemo, useState, useDeferredValue } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import { useAnimals } from "@/lib/db/hooks";
import type { Animal, AnimalStatus } from "@/types/animal";

type FilterKey = "all" | AnimalStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: mn.herd.filterAll },
  { key: "safe", label: mn.herd.chipSafe },
  { key: "warning", label: mn.herd.filterWarning },
  { key: "danger", label: mn.herd.groupDanger },
  { key: "offline", label: mn.herd.filterOffline },
];

const STATUS: Record<
  AnimalStatus,
  { dot: string; group: string; order: number }
> = {
  danger: { dot: "bg-danger", group: mn.herd.groupDanger, order: 0 },
  warning: { dot: "bg-amber", group: mn.herd.groupWarning, order: 1 },
  safe: { dot: "bg-success", group: mn.status.safe, order: 2 },
  offline: { dot: "bg-mut-2", group: mn.status.offline, order: 3 },
};

const GROUP_ORDER: AnimalStatus[] = ["danger", "warning", "safe", "offline"];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "одоо";
  if (m < 60) return `${m} минутын өмнө`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  return `${Math.round(h / 24)} хоногийн өмнө`;
}

export function HerdList() {
  const animals = useAnimals();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const deferredSearch = useDeferredValue(search);

  const counts = useMemo(() => {
    const c = { all: animals.length, safe: 0, warning: 0, danger: 0, offline: 0 };
    for (const a of animals) c[a.status]++;
    return c;
  }, [animals]);

  const groups = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const matched = animals.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (q.length === 0) return true;
      return (
        a.id.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q) ||
        (a.name?.toLowerCase().includes(q) ?? false)
      );
    });
    return GROUP_ORDER.map((status) => ({
      status,
      items: matched
        .filter((a) => a.status === status)
        .sort((x, y) => x.distanceFromBaseM - y.distanceFromBaseM),
    })).filter((g) => g.items.length > 0);
  }, [animals, deferredSearch, filter]);

  const isEmpty = groups.length === 0;

  return (
    <div className="px-4 pb-nav pt-4 md:px-6 md:pt-5">
      {/* Page header */}
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <h1 className="text-[26px] font-bold leading-none tracking-tight">
          {mn.herd.title}
        </h1>
        <span className="font-mono text-xs text-mut">
          {counts.all} {mn.herd.unit} · {counts.danger} {mn.herd.metaDanger} ·{" "}
          {counts.warning} {mn.herd.metaWarning}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-3.5">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mut"
          aria-hidden
        />
        <input
          inputMode="search"
          enterKeyHint="search"
          placeholder={mn.herd.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-[9px] border border-line bg-surface pl-10 pr-3.5 font-mono text-[13px] text-ink outline-none transition-colors placeholder:text-mut focus-visible:border-line-2"
        />
      </div>

      {/* Filter chips */}
      <div
        role="tablist"
        aria-label="Шүүх"
        className="-mx-4 mb-3.5 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
        style={{ scrollbarWidth: "none" }}
      >
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] border px-3 font-mono text-[11px] font-semibold transition-colors",
                active
                  ? "border-ink bg-ink text-bg"
                  : "border-line bg-surface text-ink-2 hover:border-line-2",
              )}
            >
              {label}
              <span className="text-[10px] opacity-70">{counts[key]}</span>
            </button>
          );
        })}
      </div>

      {/* Grouped list */}
      {isEmpty ? (
        <p className="py-16 text-center font-mono text-sm text-mut">
          {mn.herd.empty}
        </p>
      ) : (
        groups.map(({ status, items }) => (
          <div key={status}>
            <div className="mb-2 mt-3.5 flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-mut-2">
              {STATUS[status].group}
              <span className="rounded-[3px] bg-line px-1.5 py-px font-bold text-ink-2">
                {items.length}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <ul className="space-y-1.5">
              {items.map((a) => (
                <HerdRow key={a.id} animal={a} />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function HerdRow({ animal }: { animal: Animal }) {
  const offline = animal.status === "offline";
  return (
    <li>
      <Link
        href={`/herd/${animal.id}`}
        className={cn(
          "grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 rounded-[9px] border border-line bg-surface px-3.5 py-3 transition-colors hover:border-line-2",
          offline && "opacity-70",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-2.5 rounded-full ring-1 ring-line-2",
            STATUS[animal.status].dot,
          )}
        />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="truncate text-sm font-bold">
              {animal.name ?? animal.id}
            </span>
            {animal.name && (
              <span className="shrink-0 font-mono text-[10px] text-mut">
                {animal.id}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-mut">
            {mn.species[animal.species]} · {timeAgo(animal.lastSeenAt)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-bold tabular-nums">
            {offline
              ? "—"
              : `${(animal.distanceFromBaseM / 1000).toFixed(1)}км`}
          </div>
          <div className="font-mono text-[9px] text-mut-2">
            {offline ? "offline" : mn.herd.fromBase}
          </div>
        </div>
        <span aria-hidden className="text-lg text-mut-2">
          ›
        </span>
      </Link>
    </li>
  );
}
