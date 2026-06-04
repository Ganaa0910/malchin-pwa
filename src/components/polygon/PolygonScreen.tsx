"use client";

import { useMemo, useState } from "react";
import { Plus, Undo2, X, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { MapView } from "@/components/map/MapView";
import { Topbar } from "@/components/nav/Topbar";
import { useAnimals, useOwner, usePolygons } from "@/lib/db/hooks";
import { addPolygon, deletePolygon, setPolygonActive } from "@/lib/db/polygons";
import {
  pointInPolygon,
  distanceToPolygonM,
  polygonAreaKm2,
} from "@/lib/proximity";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";
import type { AnimalStatus } from "@/types/animal";
import type { CustomPolygon } from "@/types/polygon";

const STATUS_DOT: Record<AnimalStatus, string> = {
  safe: "bg-success",
  warning: "bg-amber",
  danger: "bg-danger",
  offline: "bg-mut-2",
};

const isActive = (p: CustomPolygon) => p.active !== false;

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(1)} км`;
}

export function PolygonScreen() {
  const polygons = usePolygons();
  const animals = useAnimals();
  const owner = useOwner();

  const baseLat = owner?.baseLat ?? 48.3656312;
  const baseLng = owner?.baseLng ?? 106.7407558;

  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<[number, number][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = polygons.find((p) => p.id === selectedId) ?? null;
  const activeCount = polygons.filter(isActive).length;
  const inactiveCount = polygons.length - activeCount;
  const totalArea = useMemo(
    () => polygons.reduce((s, p) => s + polygonAreaKm2(p.coordinates), 0),
    [polygons],
  );

  const distances = useMemo(() => {
    if (!selected) return [];
    return animals
      .map((a) => ({
        animal: a,
        inside: pointInPolygon(a.lat, a.lng, selected.coordinates),
        dist: distanceToPolygonM(a.lat, a.lng, selected.coordinates),
      }))
      .sort((x, y) => x.dist - y.dist);
  }, [selected, animals]);

  const insideCount = distances.filter((d) => d.inside).length;
  const nearestOutside = distances.find((d) => !d.inside);

  function startDraw() {
    setSelectedId(null);
    setDraft([]);
    setDrawing(true);
  }
  function cancelDraw() {
    setDrawing(false);
    setDraft([]);
  }
  async function saveDraw() {
    if (draft.length < 3) return;
    await addPolygon(draft, `${mn.nav.polygon} ${polygons.length + 1}`);
    setDrawing(false);
    setDraft([]);
  }
  async function handleDelete(id: string) {
    await deletePolygon(id);
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="flex h-dvh flex-col">
      <Topbar
        title={mn.polygon.title}
        sub={
          drawing ? mn.polygon.drawActive : `${polygons.length} ${mn.polygon.countLabel}`
        }
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* ===== MAP ===== */}
        <div className="relative h-[42vh] shrink-0 md:h-auto md:flex-1">
          <MapView
            height="100%"
            animals={animals}
            zones={[]}
            baseLat={baseLat}
            baseLng={baseLng}
            customPolygons={polygons.filter(isActive).map((p) => ({
              id: p.id,
              coordinates: p.coordinates,
              color: p.color,
            }))}
            selectedPolygonId={selectedId}
            onPolygonClick={drawing ? undefined : (id) => setSelectedId(id)}
            draftPolygon={drawing ? draft : undefined}
            onMapClick={
              drawing ? (lat, lng) => setDraft((d) => [...d, [lat, lng]]) : undefined
            }
          />

          {drawing && (
            <>
              {/* Draw toolbar */}
              <div className="absolute left-3 top-3 z-[1100] flex gap-1 rounded-[10px] border border-line bg-bg/95 p-1.5 shadow-lg backdrop-blur">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1.5 font-mono text-[11px] font-semibold text-white">
                  <Plus className="size-3.5" /> {mn.polygon.addPoint}
                </span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => d.slice(0, -1))}
                  disabled={draft.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-2 transition-colors hover:bg-surface disabled:opacity-40"
                >
                  <Undo2 className="size-3.5" /> {mn.polygon.removePoint}
                </button>
                <button
                  type="button"
                  onClick={cancelDraw}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-2 transition-colors hover:bg-surface"
                >
                  <X className="size-3.5" /> {mn.polygon.cancel}
                </button>
              </div>

              {/* Live hint */}
              <div className="absolute left-1/2 top-[68px] z-[1100] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[7px] bg-ink/90 px-3.5 py-2 font-mono text-[11px] text-bg backdrop-blur md:top-3">
                <span className="size-1.5 animate-pulse rounded-full bg-brand-2" />
                {mn.polygon.drawHint} · {draft.length} {mn.polygon.pointsPlaced}
              </div>

              {/* Action buttons */}
              <div className="absolute bottom-4 left-1/2 z-[1100] flex -translate-x-1/2 gap-2">
                <button
                  type="button"
                  onClick={cancelDraw}
                  className="rounded-lg border border-line bg-surface px-4 py-2.5 font-mono text-xs font-bold text-ink shadow-md"
                >
                  {mn.polygon.cancel}
                </button>
                <button
                  type="button"
                  onClick={saveDraw}
                  disabled={draft.length < 3}
                  className="rounded-lg bg-brand px-4 py-2.5 font-mono text-xs font-bold text-white shadow-md disabled:opacity-40"
                >
                  {mn.polygon.saveFence}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ===== FENCE SIDEBAR ===== */}
        <aside className="flex min-h-0 flex-1 flex-col border-t border-line bg-bg-2 md:w-80 md:flex-none md:border-l md:border-t-0">
          <div className="border-b border-line px-4 py-3.5">
            <h3 className="text-[15px] font-bold">{mn.polygon.listTitle}</h3>
            <div className="font-mono text-[11px] text-mut">
              {mn.polygon.activeLabel} {activeCount} · {mn.polygon.inactiveLabel}{" "}
              {inactiveCount}
            </div>
          </div>

          <button
            type="button"
            onClick={startDraw}
            className="mx-4 mt-3.5 flex items-center justify-center gap-1.5 rounded-lg bg-ink py-2.5 font-mono text-xs font-bold text-bg transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" /> {mn.polygon.addNew}
          </button>

          <div className="flex justify-between px-4 py-2.5 font-mono text-[11px] text-mut">
            <span>
              {mn.polygon.totalArea}:{" "}
              <b className="text-ink">{totalArea.toFixed(1)} км²</b>
            </span>
            <span>
              <b className="text-ink">{polygons.length}</b> {mn.polygon.countLabel}
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 pb-[calc(env(safe-area-inset-bottom)+84px)] pt-1 md:pb-4">
            {polygons.length === 0 ? (
              <p className="py-10 text-center font-mono text-sm text-mut">
                {mn.polygon.empty}
              </p>
            ) : (
              polygons.map((p) => (
                <FenceItem
                  key={p.id}
                  polygon={p}
                  animalsInside={
                    animals.filter((a) =>
                      pointInPolygon(a.lat, a.lng, p.coordinates),
                    ).length
                  }
                  onSelect={() => setSelectedId(p.id)}
                  onToggle={() => setPolygonActive(p.id, !isActive(p))}
                />
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Distances sheet */}
      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between gap-2">
              {selected?.name}
              {selected && (
                <button
                  type="button"
                  aria-label={mn.polygon.delete}
                  onClick={() => handleDelete(selected.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] font-semibold text-mut transition-colors hover:border-danger hover:text-danger"
                >
                  <Trash2 className="size-3.5" /> {mn.polygon.delete}
                </button>
              )}
            </SheetTitle>
            <SheetDescription className="font-mono">
              {insideCount} / {animals.length} {mn.polygon.insideCount}
              {nearestOutside &&
                ` · ${mn.polygon.nearest}: ${fmtDist(nearestOutside.dist)}`}
            </SheetDescription>
          </SheetHeader>
          <ul className="space-y-1.5 overflow-y-auto px-4 pb-6">
            {distances.map(({ animal, inside, dist }) => (
              <li
                key={animal.id}
                className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    STATUS_DOT[animal.status],
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {animal.name ?? animal.id}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm tabular-nums",
                    inside ? "font-bold text-success" : "text-mut",
                  )}
                >
                  {inside ? mn.polygon.inside : fmtDist(dist)}
                </span>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FenceItem({
  polygon,
  animalsInside,
  onSelect,
  onToggle,
}: {
  polygon: CustomPolygon;
  animalsInside: number;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const active = isActive(polygon);
  const area = polygonAreaKm2(polygon.coordinates);
  return (
    <div
      className={cn(
        "rounded-[9px] border border-line bg-surface p-3 transition-opacity",
        !active && "opacity-55",
      )}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span
            aria-hidden
            className={cn(
              "size-7 shrink-0 rounded-[7px] border-[1.5px]",
              !active && "grayscale",
            )}
            style={{
              backgroundColor: `${polygon.color}22`,
              borderColor: polygon.color,
            }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold">
              {polygon.name}
            </span>
            <span className="font-mono text-[10px] text-mut">
              POLYGON · {polygon.coordinates.length} {mn.polygon.points}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={active ? mn.polygon.activeLabel : mn.polygon.inactiveLabel}
          title={active ? mn.polygon.activeLabel : mn.polygon.inactiveLabel}
          className={cn(
            "flex size-[30px] shrink-0 items-center justify-center rounded-[7px] border transition-colors [&_svg]:size-4",
            active
              ? "border-line bg-bg-2 text-ink-2"
              : "border-transparent text-mut-2",
          )}
        >
          {active ? <Eye /> : <EyeOff />}
        </button>
      </div>
      <div className="mt-2.5 flex gap-3.5 font-mono text-[10px] text-mut">
        <span>
          {mn.polygon.area}: <b className="text-ink">{area.toFixed(1)}км²</b>
        </span>
        <span>
          {mn.polygon.animalsLabel}:{" "}
          <b className="text-ink">{animalsInside || "—"}</b>
        </span>
      </div>
    </div>
  );
}
