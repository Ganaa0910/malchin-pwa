"use client";

import { useMemo, useState } from "react";
import { Search, Bell, Plus, Minus, Crosshair } from "lucide-react";
import { useAnimals, useZones, useOwner } from "@/lib/db/hooks";
import { MapView } from "@/components/map/MapView";
import { AnimalStatusSheet } from "@/components/animal/AnimalStatusSheet";
import { Topbar, TopbarIcon } from "@/components/nav/Topbar";
import { UrgentRail } from "./UrgentRail";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";
import type { Animal } from "@/types/animal";

type Species = Animal["species"];
type SpeciesFilter = "all" | Species;

export function Dashboard() {
  const animals = useAnimals();
  const zones = useZones();
  const owner = useOwner();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [species, setSpecies] = useState<SpeciesFilter>("all");
  const [recenter, setRecenter] = useState(0);
  const [zoomIn, setZoomIn] = useState(0);
  const [zoomOut, setZoomOut] = useState(0);
  const [focus, setFocus] = useState<{ token: number; lat?: number; lng?: number }>(
    { token: 0 },
  );

  const selected = useMemo(
    () => animals.find((a) => a.id === selectedId) ?? null,
    [animals, selectedId],
  );

  const baseLat = owner?.baseLat ?? 48.3656312;
  const baseLng = owner?.baseLng ?? 106.7407558;
  const loc = `${owner?.aimag ?? "Төв"} · ${owner?.sum ?? "Батсүмбэр"}`;

  const counts = useMemo(() => {
    const c = { total: animals.length, warning: 0, danger: 0, safe: 0, offline: 0 };
    for (const a of animals) c[a.status]++;
    return c;
  }, [animals]);

  // Species chips derived from the actual herd (БҮГД + present species).
  const speciesChips = useMemo(() => {
    const m = new Map<Species, number>();
    for (const a of animals) m.set(a.species, (m.get(a.species) ?? 0) + 1);
    return [...m.entries()];
  }, [animals]);

  const shown = useMemo(
    () => (species === "all" ? animals : animals.filter((a) => a.species === species)),
    [animals, species],
  );

  const focusAnimal = (id: string) => {
    setSelectedId(id);
    const a = animals.find((x) => x.id === id);
    if (a) setFocus((f) => ({ token: f.token + 1, lat: a.lat, lng: a.lng }));
  };

  return (
    <div className="flex h-dvh flex-col">
      <Topbar
        title={mn.nav.home}
        sub={loc}
        live="LIVE · 2с"
        right={
          <>
            <TopbarIcon aria-label="Хайх">
              <Search />
            </TopbarIcon>
            <TopbarIcon aria-label={mn.nav.alerts} dot>
              <Bell />
            </TopbarIcon>
          </>
        }
      />

      <div className="relative flex-1 overflow-hidden">
        <MapView
          className="absolute inset-0"
          animals={shown}
          zones={zones}
          baseLat={baseLat}
          baseLng={baseLng}
          selectedAnimalId={selectedId}
          onAnimalClick={focusAnimal}
          recenterToken={recenter}
          zoomInToken={zoomIn}
          zoomOutToken={zoomOut}
          focusToken={focus.token}
          focusLat={focus.lat}
          focusLng={focus.lng}
        />

        {/* Top overlays — stacked on mobile, split left/right on desktop */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3 md:flex-row md:items-start md:justify-between">
          {/* Status panel */}
          <div className="pointer-events-auto w-full rounded-xl border border-line bg-bg/95 p-4 shadow-lg backdrop-blur md:w-[300px]">
            <div className="font-mono text-xs text-mut">// Сүргийн төлөв</div>
            <div className="mt-0.5 text-[17px] font-bold">{loc}</div>
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              <Stat v={counts.total} l="Нийт" />
              <Stat v={counts.safe} l="OK" tone="success" />
              <Stat v={counts.warning} l="Анхаар" tone="amber" />
              <Stat v={counts.danger} l="Давсан" tone="danger" />
            </div>
          </div>

          {/* Species filter bar */}
          <div
            className="pointer-events-auto flex gap-1 overflow-x-auto rounded-[10px] border border-line bg-bg/95 p-1.5 shadow-lg backdrop-blur"
            style={{ scrollbarWidth: "none" }}
          >
            <SpeciesChip
              label={mn.herd.filterAll}
              count={counts.total}
              active={species === "all"}
              onClick={() => setSpecies("all")}
            />
            {speciesChips.map(([sp, n]) => (
              <SpeciesChip
                key={sp}
                label={mn.species[sp].toUpperCase()}
                count={n}
                active={species === sp}
                onClick={() => setSpecies(sp)}
              />
            ))}
          </div>
        </div>

        {/* Map controls */}
        <div className="absolute right-3 bottom-[calc(env(safe-area-inset-bottom)+188px)] z-20 flex flex-col gap-1.5 md:bottom-[124px]">
          <MapBtn aria-label="Томруулах" onClick={() => setZoomIn((n) => n + 1)}>
            <Plus />
          </MapBtn>
          <MapBtn aria-label="Жижигрүүлэх" onClick={() => setZoomOut((n) => n + 1)}>
            <Minus />
          </MapBtn>
          <MapBtn
            aria-label="Хот руу буцах"
            onClick={() => setRecenter((n) => n + 1)}
          >
            <Crosshair />
          </MapBtn>
        </div>

        {/* Urgent card strip */}
        <UrgentRail
          animals={shown}
          selectedId={selectedId}
          onSelect={focusAnimal}
        />
      </div>

      <AnimalStatusSheet
        animal={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}

function Stat({
  v,
  l,
  tone,
}: {
  v: number;
  l: string;
  tone?: "success" | "amber" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "amber"
        ? "text-amber"
        : tone === "success"
          ? "text-success"
          : "text-ink";
  return (
    <div className="rounded-[7px] border border-line bg-surface px-2 py-1.5 text-center">
      <div className={cn("font-mono text-lg font-bold leading-none", toneClass)}>
        {v}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-wide text-mut">
        {l}
      </div>
    </div>
  );
}

function SpeciesChip({
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
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-colors",
        active ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface",
      )}
    >
      {label}
      <span className="opacity-60">{count}</span>
    </button>
  );
}

function MapBtn({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 shadow-sm transition-colors hover:bg-bg-2 active:scale-95 [&_svg]:size-4"
      {...props}
    >
      {children}
    </button>
  );
}
