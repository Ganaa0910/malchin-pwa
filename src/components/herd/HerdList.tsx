"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import { useAnimals, useOwner } from "@/lib/db/hooks";
import { devicesApi, type Device as TraccarDevice } from "@/lib/api";
import { createAnimalProfileFromTraccarDevice, deleteAnimalProfile } from "@/lib/db/animals";
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

const CATEGORIES = ["cow", "truck", "car", "person", "default"] as const;

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
  const owner = useOwner();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [traccarDevices, setTraccarDevices] = useState<TraccarDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creatingDeviceId, setCreatingDeviceId] = useState<number | null>(null);
  const [deletingAnimalId, setDeletingAnimalId] = useState<string | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualDevice, setManualDevice] = useState({
    name: "",
    uniqueId: "",
    category: "cow",
    phone: "",
  });
  const deferredSearch = useDeferredValue(search);

  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      const devices = await devicesApi.list();
      setTraccarDevices(devices);
    } catch (error: any) {
      setActionError(error?.message || "Төхөөрөмжийн мэдээлэл авах үед алдаа гарлаа");
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    void loadDevices();
  }, []);

  const traccarDeviceIds = useMemo(
    () => new Set(animals.map((animal) => animal.deviceId)),
    [animals],
  );

  const availableDevices = traccarDevices.filter(
    (device) => !traccarDeviceIds.has(`D-T-${device.id}`),
  );

  const activeHerdId = animals[0]?.herdId ?? "herd-cow";
  const ownerId = owner?.id ?? animals[0]?.ownerId ?? "owner-1";
  const baseLat = owner?.baseLat ?? animals[0]?.lat ?? 0;
  const baseLng = owner?.baseLng ?? animals[0]?.lng ?? 0;

  const createProfile = async (device: TraccarDevice) => {
    setActionError(null);
    setCreatingDeviceId(device.id);

    try {
      await createAnimalProfileFromTraccarDevice(
        device,
        ownerId,
        activeHerdId,
        baseLat,
        baseLng,
      );
    } catch (error: any) {
      setActionError(error?.message || "Профайл үүсгэх үед алдаа гарлаа");
    } finally {
      setCreatingDeviceId(null);
    }
  };

  const removeAnimal = async (animal: Animal) => {
    if (!confirm(`"${animal.name ?? animal.id}" профайлыг устгах уу?`)) {
      return;
    }

    setActionError(null);
    setDeletingAnimalId(animal.id);

    try {
      await deleteAnimalProfile(animal);
    } catch (error: any) {
      setActionError(error?.message || "Профайл устгах үед алдаа гарлаа");
    } finally {
      setDeletingAnimalId(null);
    }
  };

  const createUserDevice = async () => {
    if (!manualDevice.name.trim() || !manualDevice.uniqueId.trim()) {
      setActionError("Нэр болон IMEI/ID заавал шаардлагатай");
      return;
    }

    setActionError(null);
    setCreatingDeviceId(-1);

    try {
      const created = await devicesApi.create({
        name: manualDevice.name,
        uniqueId: manualDevice.uniqueId,
        phone: manualDevice.phone || undefined,
        category: manualDevice.category,
      });

      await createAnimalProfileFromTraccarDevice(
        created,
        ownerId,
        activeHerdId,
        baseLat,
        baseLng,
      );

      setManualDevice({ name: "", uniqueId: "", category: "cow", phone: "" });
      setShowManualAdd(false);
      await loadDevices();
    } catch (error: any) {
      setActionError(error?.message || "Төхөөрөмж бүртгэх үед алдаа гарлаа");
    } finally {
      setCreatingDeviceId(null);
    }
  };

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
      <div className="mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold leading-none tracking-tight">
            {mn.herd.title}
          </h1>
          <p className="font-mono text-xs text-mut">
            {counts.all} {mn.herd.unit} · {counts.danger} {mn.herd.metaDanger} · {counts.warning} {mn.herd.metaWarning}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => setShowManualAdd((current) => !current)}>
            Add
          </Button>
        </div>
      </div>

      {showManualAdd && (
        <div className="mb-4 rounded-3xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">GPS төхөөрөмж бүртгэх</p>
              <p className="mt-1 text-xs text-mut">Треккар-т шинэ төхөөрөмж нэмэх ба Сүрэгт холбох.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualAdd(false)}
              className="rounded-[10px] border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink hover:text-ink"
            >
              Хаах
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Нэр *</label>
              <input
                className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={manualDevice.name}
                onChange={(e) => setManualDevice((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Жишээ: Буурал 01"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">IMEI / ID *</label>
              <input
                className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={manualDevice.uniqueId}
                onChange={(e) => setManualDevice((prev) => ({ ...prev, uniqueId: e.target.value }))}
                placeholder="123456789012345"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Утас</label>
              <input
                className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={manualDevice.phone}
                onChange={(e) => setManualDevice((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+97611223344"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Категори</label>
              <select
                className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={manualDevice.category}
                onChange={(e) => setManualDevice((prev) => ({ ...prev, category: e.target.value }))}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={createUserDevice}
              disabled={creatingDeviceId === -1}
              className="rounded-[12px] bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingDeviceId === -1 ? "Бүртгэж байна…" : "Бүртгэх"}
            </button>
            <button
              type="button"
              onClick={() => setShowManualAdd(false)}
              className="rounded-[12px] border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:text-ink"
            >
              Болих
            </button>
          </div>
        </div>
      )}

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
                <HerdRow
                  key={a.id}
                  animal={a}
                  onDelete={removeAnimal}
                  deleting={deletingAnimalId === a.id}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function HerdRow({
  animal,
  onDelete,
  deleting,
}: {
  animal: Animal;
  onDelete: (animal: Animal) => void;
  deleting: boolean;
}) {
  const offline = animal.status === "offline";
  return (
    <li>
      <div
        className={cn(
          "grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 rounded-[9px] border border-line bg-surface px-3.5 py-3 transition-colors hover:border-line-2",
          offline && "opacity-70",
        )}
      >
        <Link href={`/herd/${animal.id}`} className="contents">
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
        <button
          type="button"
          onClick={() => onDelete(animal)}
          disabled={deleting}
          className="rounded-[10px] border border-line bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Устаж байна…" : "Устгах"}
        </button>
      </div>
    </li>
  );
}
