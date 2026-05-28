"use client";

import Link from "next/link";
import { useMemo, useState, useDeferredValue } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import { useAnimals } from "@/lib/db/hooks";
import type { Animal, AnimalStatus } from "@/types/animal";

type FilterKey = "all" | AnimalStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: mn.herd.filterAll },
  { key: "safe", label: mn.herd.filterSafe },
  { key: "warning", label: mn.herd.filterWarning },
  { key: "danger", label: mn.herd.filterDanger },
  { key: "offline", label: mn.herd.filterOffline },
];

const STATUS_DOT: Record<AnimalStatus, string> = {
  safe: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  offline: "bg-muted-foreground",
};

const STATUS_RANK: Record<AnimalStatus, number> = {
  danger: 0,
  warning: 1,
  offline: 2,
  safe: 3,
};

function timeAgoShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "одоо";
  if (m < 60) return `${m}м`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}ц`;
  return `${Math.round(h / 24)}х`;
}

export function HerdList() {
  const animals = useAnimals();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const list = animals.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (q.length === 0) return true;
      return (
        a.id.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q) ||
        (a.name?.toLowerCase().includes(q) ?? false)
      );
    });
    return list.sort((x, y) => {
      const dr = STATUS_RANK[x.status] - STATUS_RANK[y.status];
      if (dr !== 0) return dr;
      return x.distanceFromBaseM - y.distanceFromBaseM;
    });
  }, [animals, deferredSearch, filter]);

  const counts = useMemo(() => {
    const c = { all: animals.length, safe: 0, warning: 0, danger: 0, offline: 0 };
    for (const a of animals) c[a.status]++;
    return c;
  }, [animals]);

  return (
    <div className="px-4 py-3 pb-nav space-y-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          aria-hidden
        />
        <Input
          inputMode="search"
          enterKeyHint="search"
          placeholder={mn.herd.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="tap pl-9"
        />
      </div>

      <div
        role="tablist"
        aria-label="Шүүх"
        className="flex gap-1.5 -mx-4 px-4 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          const n = counts[key];
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 h-8",
                "rounded-md text-sm transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Олдсонгүй
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => (
            <HerdRow key={a.id} animal={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

function HerdRow({ animal }: { animal: Animal }) {
  return (
    <li>
      <Link
        href={`/herd/${animal.id}`}
        className={cn(
          "tap flex items-center gap-3 rounded-md border bg-card text-card-foreground",
          "px-3 py-2.5 hover:bg-accent transition-colors",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-2.5 rounded-full shrink-0",
            STATUS_DOT[animal.status],
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-base leading-tight truncate">
              {animal.name ?? animal.id}
            </span>
            {animal.name && (
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {animal.id}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{mn.species[animal.species]}</span>
            <span aria-hidden>·</span>
            <span className="font-mono">
              {(animal.distanceFromBaseM / 1000).toFixed(1)} км
            </span>
            <span aria-hidden>·</span>
            <span className="font-mono">
              {timeAgoShort(animal.lastSeenAt)}
            </span>
          </div>
        </div>
        <ChevronRight
          className="size-4 text-muted-foreground shrink-0"
          aria-hidden
        />
      </Link>
    </li>
  );
}
