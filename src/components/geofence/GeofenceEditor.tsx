"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Layers3, Tent, OctagonAlert, Wind } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapView } from "@/components/map/MapView";
import { useAnimals, useZones, useOwner } from "@/lib/db/hooks";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";
import type { Zone, ZoneType } from "@/types/zone";

const ZONE_ICON: Record<ZoneType, typeof Layers3> = {
  pasture: Layers3,
  camp: Tent,
  forbidden: OctagonAlert,
  buffer: Wind,
};

export function GeofenceEditor() {
  const zones = useZones();
  const animals = useAnimals();
  const owner = useOwner();
  const [editing, setEditing] = useState<Zone | null>(null);

  const baseLat = owner?.baseLat ?? 48.05;
  const baseLng = owner?.baseLng ?? 109.65;

  async function toggleActive(zone: Zone, active: boolean) {
    await getDb().zones.update(zone.id, { active });
    await getDb().syncQueue.add({
      kind: "update-zone",
      payload: { id: zone.id, active },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
  }

  return (
    <div className="px-4 py-3 pb-nav space-y-4">
      <div
        className="rounded-lg border overflow-hidden"
        style={{ height: "min(38vh, 280px)" }}
      >
        <MapView
          animals={animals}
          zones={zones}
          baseLat={baseLat}
          baseLng={baseLng}
        />
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="tap w-full" variant="outline">
            <Plus className="size-4 mr-1" aria-hidden />
            {mn.geofence.addZone}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-w-[420px] mx-auto pb-safe"
        >
          <SheetHeader className="px-5">
            <SheetTitle className="text-lg">{mn.geofence.addZone}</SheetTitle>
            <SheetDescription>
              Зурах горим удахгүй. Одоо байгаа бүсүүдийг засварлаж болно.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <ul className="space-y-2">
        {zones.map((z) => {
          const Icon = ZONE_ICON[z.type];
          return (
            <li
              key={z.id}
              className="rounded-lg border bg-card text-card-foreground p-3"
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    z.type === "forbidden"
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{z.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mn.zoneType[z.type]} ·{" "}
                    <span className="tabular-nums">
                      {z.coordinates.length} цэг
                    </span>
                  </p>
                </div>
                <Switch
                  checked={z.active}
                  onCheckedChange={(v) => toggleActive(z, v)}
                  aria-label={`${z.name} идэвхжүүлэх`}
                />
              </div>
              <dl className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">
                    {mn.geofence.bufferLabel}
                  </dt>
                  <dd className="tabular-nums mt-0.5">{z.bufferM} м</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {mn.geofence.deterLabel}
                  </dt>
                  <dd className="tabular-nums mt-0.5">{z.deterM} м</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setEditing(z)}
                className="tap mt-2 text-xs font-medium inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Pencil className="size-3" aria-hidden />
                Засах
              </button>
            </li>
          );
        })}
      </ul>

      <ZoneEditSheet
        zone={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}

function ZoneEditSheet({
  zone,
  open,
  onOpenChange,
}: {
  zone: Zone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [bufferM, setBufferM] = useState(zone?.bufferM ?? 200);
  const [deterM, setDeterM] = useState(zone?.deterM ?? 50);

  useEffect(() => {
    if (zone) {
      setBufferM(zone.bufferM);
      setDeterM(zone.deterM);
    }
  }, [zone?.id, zone?.bufferM, zone?.deterM, zone]);

  async function save() {
    if (!zone) return;
    await getDb().zones.update(zone.id, { bufferM, deterM });
    await getDb().syncQueue.add({
      kind: "update-zone",
      payload: { id: zone.id, bufferM, deterM },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-[420px] mx-auto pb-safe">
        <SheetHeader className="px-5">
          <SheetTitle className="text-lg">{zone?.name ?? ""}</SheetTitle>
          <SheetDescription>
            Анхаарах болон эргүүлэх зайг тохируулна
          </SheetDescription>
        </SheetHeader>
        {zone && (
          <div className="px-5 pb-2 space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <label
                  htmlFor="bufferM"
                  className="text-sm font-medium"
                >
                  {mn.geofence.bufferLabel}
                </label>
                <span className="font-mono text-sm">{bufferM} м</span>
              </div>
              <input
                id="bufferM"
                type="range"
                min={50}
                max={1000}
                step={10}
                value={bufferM}
                onChange={(e) => setBufferM(Number(e.target.value))}
                className="w-full accent-[color:var(--primary)] tap"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <label
                  htmlFor="deterM"
                  className="text-sm font-medium"
                >
                  {mn.geofence.deterLabel}
                </label>
                <span className="font-mono text-sm">{deterM} м</span>
              </div>
              <input
                id="deterM"
                type="range"
                min={10}
                max={500}
                step={5}
                value={deterM}
                onChange={(e) => setDeterM(Number(e.target.value))}
                className="w-full accent-[color:var(--primary)] tap"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="tap flex-1"
                onClick={() => onOpenChange(false)}
              >
                {mn.geofence.cancel}
              </Button>
              <Button className="tap flex-1" onClick={save}>
                {mn.geofence.save}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
