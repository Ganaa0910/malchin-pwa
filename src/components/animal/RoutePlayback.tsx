"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { MapView } from "@/components/map/MapView";
import { useZones } from "@/lib/db/hooks";
import { generateRoute } from "@/lib/routeGen";
import { mn } from "@/lib/i18n/mn";
import type { Animal } from "@/types/animal";

type Range = "24h" | "7d";

export function RoutePlayback({ animal }: { animal: Animal }) {
  const zones = useZones();
  const [range, setRange] = useState<Range>("24h");

  const route = useMemo(() => generateRoute(animal, range), [animal, range]);
  const [idx, setIdx] = useState(() => route.length - 1);

  // When range changes, snap to latest position
  const safeIdx = Math.min(idx, route.length - 1);
  const current = route[safeIdx];

  return (
    <section className="space-y-3">
      <Tabs
        value={range}
        onValueChange={(v) => {
          setRange(v as Range);
          setIdx(route.length - 1);
        }}
      >
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="24h" className="tap">
            {mn.animal.last24h}
          </TabsTrigger>
          <TabsTrigger value="7d" className="tap">
            {mn.animal.last7d}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={range} className="space-y-3 mt-3">
          <div
            className="rounded-md border-card overflow-hidden"
            style={{
              boxShadow: "var(--shadow-card)",
              height: "min(48vh, 360px)",
            }}
          >
            <MapView
              animals={[animal]}
              zones={zones}
              baseLat={animal.lat}
              baseLng={animal.lng}
              selectedAnimalId={animal.id}
              routePath={route.map((p) => ({ lat: p.lat, lng: p.lng }))}
              routeCurrentIdx={safeIdx}
            />
          </div>

          <div className="space-y-2 px-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-mono text-muted-foreground">
                {format(new Date(current.ts), "yyyy-MM-dd HH:mm")}
              </span>
              <span className="font-mono">
                {current.speedKmh.toFixed(1)} {mn.weather.windUnit}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={route.length - 1}
              value={safeIdx}
              onChange={(e) => setIdx(Number(e.target.value))}
              aria-label="Цаг шилжүүлэх"
              className="w-full accent-[color:var(--primary)] tap"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{format(new Date(route[0].ts), "MM-dd HH:mm")}</span>
              <span>
                {format(new Date(route[route.length - 1].ts), "MM-dd HH:mm")}
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
