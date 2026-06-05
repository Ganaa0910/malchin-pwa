"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { MapView } from "@/components/map/MapView";
import { useZones } from "@/lib/db/hooks";
import { tripsApi, geofencesApi, type Geofence } from "@/lib/api";
import { parseTraccarDeviceId } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import type { Animal } from "@/types/animal";

type Range = "24h" | "7d";

interface RoutePoint {
  lat: number;
  lng: number;
  ts?: string;
  speedKmh?: number;
}

export function RoutePlayback({ animal }: { animal: Animal }) {
  const zones = useZones();
  const [range, setRange] = useState<Range>("24h");
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);

  const routeStart = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - (range === "24h" ? 1 : 7));
    return from.toISOString();
  }, [range]);

  const routeEnd = useMemo(() => new Date().toISOString(), [range]);

  // Fetch geofences once on mount
  useEffect(() => {
    let active = true;
    geofencesApi.list()
      .then((data) => {
        if (!active) return;
        setGeofences(data);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to fetch geofences:", error);
        setGeofences([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const deviceId = parseTraccarDeviceId(animal.deviceId);
    if (deviceId === undefined) {
      setRoute([]);
      setIdx(0);
      setRouteError("GPS төхөөрөмж холбогдоогүй байна.");
      return;
    }

    let active = true;
    setLoading(true);
    setRouteError(null);

    tripsApi.route(deviceId, routeStart, routeEnd)
      .then((points) => {
        if (!active) return;
        setRoute(points);
        setIdx(points.length > 0 ? points.length - 1 : 0);
        if (points.length === 0) {
          setRouteError("Traccar-ээс маршрут олдсонгүй.");
        }
      })
      .catch((error) => {
        if (!active) return;
        setRoute([]);
        setIdx(0);
        setRouteError(error.message || "Маршрут ачаалж чадсангүй.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [animal.deviceId, routeStart, routeEnd]);

  // When route changes, snap to latest position
  const safeIdx = Math.min(idx, Math.max(route.length - 1, 0));
  const current = route[safeIdx] ?? { lat: animal.lat, lng: animal.lng, ts: routeEnd, speedKmh: 0 };

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
            className="rounded-lg border overflow-hidden"
            style={{ height: "min(48vh, 360px)" }}
          >
            <MapView
              animals={[animal]}
              zones={zones}
              geofences={geofences}
              baseLat={animal.lat}
              baseLng={animal.lng}
              selectedAnimalId={animal.id}
              routePath={route.map((p) => ({ lat: p.lat, lng: p.lng }))}
              routeCurrentIdx={safeIdx}
            />
          </div>

          <div className="space-y-2 px-1">
            {loading ? (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                Маршрут ачаалж байна...
              </div>
            ) : routeError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                {routeError}
              </div>
            ) : route.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                Энэ амьтанд маршрутын түүх байршил байхгүй байна.
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-mono text-muted-foreground">
                    {format(new Date(current.ts ?? routeEnd), "yyyy-MM-dd HH:mm")}
                  </span>
                  <span className="font-mono">
                    {(current.speedKmh ?? 0).toFixed(1)} {mn.weather.windUnit}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(route.length - 1, 0)}
                  value={safeIdx}
                  onChange={(e) => setIdx(Number(e.target.value))}
                  aria-label="Цаг үе"
                  className="w-full accent-[color:var(--primary)] tap"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{format(new Date(route[0].ts ?? routeStart), "MM-dd HH:mm")}</span>
                  <span>
                    {format(new Date(route[route.length - 1].ts ?? routeEnd), "MM-dd HH:mm")}
                  </span>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
