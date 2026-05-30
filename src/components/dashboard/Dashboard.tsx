"use client";

import { useMemo, useState } from "react";
import { Crosshair } from "lucide-react";
import { useAnimals, useZones, useOwner } from "@/lib/db/hooks";
import { MapView } from "@/components/map/MapView";
import { AnimalStatusSheet } from "@/components/animal/AnimalStatusSheet";
import { UrgentRail } from "./UrgentRail";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const animals = useAnimals();
  const zones = useZones();
  const owner = useOwner();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recenter, setRecenter] = useState(0);
  const [focus, setFocus] = useState<{ token: number; lat?: number; lng?: number }>({
    token: 0,
  });

  const selected = useMemo(
    () => animals.find((a) => a.id === selectedId) ?? null,
    [animals, selectedId],
  );

  const baseLat = owner?.baseLat ?? 48.05;
  const baseLng = owner?.baseLng ?? 109.65;

  const counts = useMemo(() => {
    const c = { total: animals.length, warning: 0, danger: 0, offline: 0 };
    for (const a of animals) {
      if (a.status === "warning") c.warning++;
      else if (a.status === "danger") c.danger++;
      else if (a.status === "offline") c.offline++;
    }
    return c;
  }, [animals]);

  return (
    <>
      <div className="relative h-dvh w-full overflow-hidden">
        <MapView
          className="absolute inset-0"
          animals={animals}
          zones={zones}
          baseLat={baseLat}
          baseLng={baseLng}
          selectedAnimalId={selectedId}
          onAnimalClick={(id) => {
            setSelectedId(id);
            const a = animals.find((x) => x.id === id);
            if (a) {
              setFocus((f) => ({ token: f.token + 1, lat: a.lat, lng: a.lng }));
            }
          }}
          recenterToken={recenter}
          focusToken={focus.token}
          focusLat={focus.lat}
          focusLng={focus.lng}
        />

        {/* Top floating card — location + status summary */}
        <div className="pointer-events-none absolute inset-x-0 top-0 pt-safe px-3 z-20 flex justify-center md:justify-start md:px-4">
          <div
            className={cn(
              "pointer-events-auto mt-3 w-full max-w-sm",
              "rounded-xl border bg-background/90 backdrop-blur",
              "shadow-sm",
            )}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <p className="text-sm font-medium">
                {owner?.aimag ?? "Хэнтий"} · {owner?.sum ?? "Хэрлэн"}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {counts.total} мал
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x">
              <Stat label="Анхаар" value={counts.warning} tone="warning" />
              <Stat label="Гарсан" value={counts.danger} tone="danger" />
              <Stat
                label="Холбоогүй"
                value={counts.offline}
                tone="muted"
              />
            </div>
          </div>
        </div>

        {/* Floating recenter button — sits above the urgent rail */}
        <button
          type="button"
          aria-label="Хот руу буцах"
          onClick={() => setRecenter((n) => n + 1)}
          className={cn(
            "pointer-events-auto absolute right-4 z-30",
            "size-11 rounded-full border bg-background shadow-sm",
            "flex items-center justify-center",
            "hover:bg-accent active:scale-95 transition",
          )}
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 218px)",
          }}
        >
          <Crosshair className="size-5" />
        </button>

        {/* Urgent animals rail — pinned above bottom nav */}
        <UrgentRail
          animals={animals}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            const a = animals.find((x) => x.id === id);
            if (a) {
              setFocus((f) => ({ token: f.token + 1, lat: a.lat, lng: a.lng }));
            }
          }}
          bottomOffset={84}
        />
      </div>

      <AnimalStatusSheet
        animal={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "danger" | "muted";
}) {
  const toneClass =
    tone === "warning"
      ? "text-warning-foreground"
      : tone === "danger"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div className="px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-base font-semibold tabular-nums",
          value > 0 ? toneClass : "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
