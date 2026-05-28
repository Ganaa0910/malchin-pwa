"use client";

import { useState } from "react";
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
    <div className="px-5 py-3 space-y-4">
      <div
        className="rounded-md border-card overflow-hidden"
        style={{
          boxShadow: "var(--shadow-card)",
          height: "min(38vh, 280px)",
        }}
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
          <Button className="tap w-full" size="lg">
            <Plus className="size-4 mr-1" aria-hidden />
            {mn.geofence.addZone}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-w-[420px] mx-auto pb-safe rounded-t-xl"
          style={{ borderRadius: "var(--radius) var(--radius) 0 0" }}
        >
          <SheetHeader className="px-5">
            <SheetTitle className="font-display text-2xl">
              {mn.geofence.addZone}
            </SheetTitle>
            <SheetDescription>
              Полигон зурах горим удахгүй нэмэгдэнэ. Одоохондоо одоо байгаа
              бүсүүдийг засварлаж болно.
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
              className="rounded-md border-card bg-card text-card-foreground p-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "size-10 shrink-0 rounded-full flex items-center justify-center",
                  )}
                  style={{
                    background: z.color
                      ? `color-mix(in srgb, ${z.color} 25%, transparent)`
                      : "var(--muted)",
                    color: z.color ?? "var(--fg)",
                  }}
                >
                  <Icon className="size-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base leading-tight">
                    {z.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mn.zoneType[z.type]} ·{" "}
                    <span className="font-mono">
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
              <dl className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="rounded-sm bg-muted px-2 py-1.5">
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {mn.geofence.bufferLabel}
                  </dt>
                  <dd className="font-mono">{z.bufferM} м</dd>
                </div>
                <div className="rounded-sm bg-muted px-2 py-1.5">
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {mn.geofence.deterLabel}
                  </dt>
                  <dd className="font-mono">{z.deterM} м</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setEditing(z)}
                className="tap mt-2 text-xs font-semibold inline-flex items-center gap-1 text-primary"
              >
                <Pencil className="size-3" aria-hidden />
                Засварлах
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

  // Sync local state when a new zone is selected
  if (zone && open && bufferM !== zone.bufferM && deterM !== zone.deterM) {
    setBufferM(zone.bufferM);
    setDeterM(zone.deterM);
  }

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
      <SheetContent
        side="bottom"
        className="max-w-[420px] mx-auto pb-safe rounded-t-xl"
        style={{ borderRadius: "var(--radius) var(--radius) 0 0" }}
      >
        <SheetHeader className="px-5">
          <SheetTitle className="font-display text-2xl">
            {zone?.name ?? ""}
          </SheetTitle>
          <SheetDescription>
            Анхааруулга болон дайчилгааны зайг тохируулна
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
