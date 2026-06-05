"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Plus, Minus, Crosshair } from "lucide-react";
import { useAnimals, useZones, useOwner, usePolygons } from "@/lib/db/hooks";
import { MapView } from "@/components/map/MapView";
import { AnimalStatusSheet } from "@/components/animal/AnimalStatusSheet";
import { Topbar, TopbarIcon } from "@/components/nav/Topbar";
import { UrgentRail } from "./UrgentRail";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const router = useRouter();
  const animals = useAnimals();
  const zones = useZones();
  const polygons = usePolygons();
  const owner = useOwner();
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // User-drawn virtual fences (Виртуал хашаа) overlaid on the map alongside zones.
  const customPolygons = useMemo(
    () =>
      polygons
        .filter((p) => p.active !== false)
        .map((p) => ({ id: p.id, coordinates: p.coordinates, color: p.color })),
    [polygons],
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
        right={
          <>
            <TopbarIcon aria-label="Хайх">
              <Search />
            </TopbarIcon>
            <TopbarIcon
              aria-label={mn.nav.alerts}
              dot
              onClick={() => router.push("/alerts")}
            >
              <Bell />
            </TopbarIcon>
          </>
        }
      />

      <div className="relative flex-1 overflow-hidden">
        <MapView
          className="absolute inset-0"
          animals={animals}
          zones={zones}
          customPolygons={customPolygons}
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

        {/* Top overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3">
          {/* Status panel */}
          <div className="pointer-events-auto w-full rounded-xl border border-line bg-bg/95 p-4 shadow-lg backdrop-blur md:w-[300px]">
            <div className="font-mono text-xs text-mut">Сүргийн төлөв</div>
            <div className="mt-0.5 text-[17px] font-bold">{loc}</div>
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              <Stat v={counts.total} l="Нийт" />
              <Stat v={counts.safe} l="OK" tone="success" />
              <Stat v={counts.warning} l="Анхаар" tone="amber" />
              <Stat v={counts.danger} l="Давсан" tone="danger" />
            </div>
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
          animals={animals}
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
