"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Undo2,
  Check,
  X,
  Trash2,
  ChevronRight,
  Hexagon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/map/MapView";
import { useAnimals, useOwner, usePolygons } from "@/lib/db/hooks";
import { addPolygon, deletePolygon } from "@/lib/db/polygons";
import { pointInPolygon, distanceToPolygonM } from "@/lib/proximity";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";
import type { AnimalStatus } from "@/types/animal";

const STATUS_DOT: Record<AnimalStatus, string> = {
  safe: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  offline: "bg-muted-foreground",
};

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
    <div className="pb-nav">
      <div className="relative h-[52vh] max-h-[460px] overflow-hidden border-y md:mt-3 md:rounded-lg md:border">
        <MapView
          height="100%"
          animals={animals}
          zones={[]}
          baseLat={baseLat}
          baseLng={baseLng}
          customPolygons={polygons.map((p) => ({
            id: p.id,
            coordinates: p.coordinates,
            color: p.color,
          }))}
          selectedPolygonId={selectedId}
          onPolygonClick={drawing ? undefined : (id) => setSelectedId(id)}
          draftPolygon={drawing ? draft : undefined}
          onMapClick={
            drawing
              ? (lat, lng) => setDraft((d) => [...d, [lat, lng]])
              : undefined
          }
        />

        {drawing ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1100] p-3">
            <div className="pointer-events-auto rounded-xl border bg-background/95 backdrop-blur shadow-md p-3 space-y-2.5">
              <p className="text-xs text-muted-foreground">
                {mn.polygon.drawHint}
                <span className="ml-1 tabular-nums text-foreground">
                  ({draft.length} {mn.polygon.points})
                </span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelDraw}>
                  <X className="size-4" /> {mn.polygon.cancel}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDraft((d) => d.slice(0, -1))}
                  disabled={draft.length === 0}
                >
                  <Undo2 className="size-4" /> {mn.polygon.undo}
                </Button>
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={saveDraw}
                  disabled={draft.length < 3}
                >
                  <Check className="size-4" /> {mn.polygon.save}
                </Button>
              </div>
              {draft.length > 0 && draft.length < 3 && (
                <p className="text-[11px] text-muted-foreground">
                  {mn.polygon.minPoints}
                </p>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startDraw}
            className={cn(
              "tap absolute bottom-3 left-3 z-[1100] inline-flex items-center gap-2",
              "rounded-full border bg-background/95 backdrop-blur px-4 shadow-sm",
              "text-sm font-medium hover:bg-accent active:scale-95 transition",
            )}
          >
            <Plus className="size-4" /> {mn.polygon.add}
          </button>
        )}
      </div>

      {/* Polygon list */}
      <div className="px-4 py-3 space-y-2">
        {polygons.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Hexagon className="size-8 opacity-40" />
            <p className="text-sm">{mn.polygon.empty}</p>
          </div>
        ) : (
          polygons.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                className="tap flex flex-1 items-center gap-3 text-left"
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {p.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.coordinates.length} {mn.polygon.points}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
              <button
                type="button"
                aria-label={mn.polygon.delete}
                onClick={() => handleDelete(p.id)}
                className="tap shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Distances sheet */}
      <Sheet
        open={selected !== null}
        onOpenChange={(o) => !o && setSelectedId(null)}
      >
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>{selected?.name}</SheetTitle>
            <SheetDescription>
              {insideCount} / {animals.length} {mn.polygon.insideCount}
              {nearestOutside &&
                ` · ${mn.polygon.nearest}: ${fmtDist(nearestOutside.dist)}`}
            </SheetDescription>
          </SheetHeader>
          <ul className="overflow-y-auto px-4 pb-6 space-y-1.5">
            {distances.map(({ animal, inside, dist }) => (
              <li
                key={animal.id}
                className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
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
                    "shrink-0 text-sm tabular-nums",
                    inside ? "font-medium text-success" : "text-muted-foreground",
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
