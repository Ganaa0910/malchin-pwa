"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Animal, AnimalStatus } from "@/types/animal";
import type { Zone } from "@/types/zone";

type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

const STATUS_COLOR: Record<AnimalStatus, string> = {
  safe: "#1d9e75",
  warning: "#e8a23a",
  danger: "#e54d4d",
  offline: "#9aa3a8",
};

const ZONE_FILL_OPACITY: Record<Zone["type"], number> = {
  pasture: 0.12,
  camp: 0.18,
  forbidden: 0.15,
  buffer: 0.08,
};

function calcBounds(
  zones: Zone[],
  animals: Animal[],
  padPct = 0.08,
): Bounds {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  for (const z of zones) {
    for (const [la, lo] of z.coordinates) {
      if (la < minLat) minLat = la;
      if (la > maxLat) maxLat = la;
      if (lo < minLng) minLng = lo;
      if (lo > maxLng) maxLng = lo;
    }
  }
  for (const a of animals) {
    if (a.lat < minLat) minLat = a.lat;
    if (a.lat > maxLat) maxLat = a.lat;
    if (a.lng < minLng) minLng = a.lng;
    if (a.lng > maxLng) maxLng = a.lng;
  }
  if (!Number.isFinite(minLat)) {
    minLat = 47.9;
    maxLat = 48.2;
    minLng = 109.5;
    maxLng = 109.8;
  }
  const dLat = (maxLat - minLat) * padPct;
  const dLng = (maxLng - minLng) * padPct;
  return {
    minLat: minLat - dLat,
    maxLat: maxLat + dLat,
    minLng: minLng - dLng,
    maxLng: maxLng + dLng,
  };
}

function project(
  lat: number,
  lng: number,
  b: Bounds,
  w: number,
  h: number,
): [number, number] {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * w;
  const y = h - ((lat - b.minLat) / (b.maxLat - b.minLat)) * h;
  return [x, y];
}

export interface MapViewProps {
  animals: Animal[];
  zones: Zone[];
  baseLat: number;
  baseLng: number;
  onAnimalClick?: (id: string) => void;
  selectedAnimalId?: string | null;
  /** Optional route path — when provided, MapView focuses on the route. */
  routePath?: { lat: number; lng: number }[];
  routeCurrentIdx?: number;
  height?: string | number;
  className?: string;
}

/**
 * Placeholder map — SVG-projected. Renders zones as polygons and animals as
 * status-colored pins. Swap for Leaflet/Mapbox later by replacing this
 * component; the prop shape mirrors a typical map-lib contract.
 */
export function MapView({
  animals,
  zones,
  baseLat,
  baseLng,
  onAnimalClick,
  selectedAnimalId = null,
  routePath,
  routeCurrentIdx,
  height = "100%",
  className,
}: MapViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 360 });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setSize({ w: Math.max(280, width), h: Math.max(280, height) });
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const bounds = useMemo(() => {
    if (routePath && routePath.length > 0) {
      // Focus bounds on the route + selected animal current pos
      const focusAnimal = selectedAnimalId
        ? animals.filter((a) => a.id === selectedAnimalId)
        : [];
      const dummyZones: Zone[] = routePath.length
        ? [
            {
              id: "_route",
              name: "_route",
              type: "pasture",
              coordinates: routePath.map((p) => [p.lat, p.lng] as [number, number]),
              bufferM: 0,
              deterM: 0,
              active: true,
            },
          ]
        : [];
      return calcBounds(dummyZones, focusAnimal, 0.25);
    }
    return calcBounds(zones, animals);
  }, [zones, animals, routePath, selectedAnimalId]);

  const [baseX, baseY] = project(baseLat, baseLng, bounds, size.w, size.h);

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full overflow-hidden",
        "bg-[var(--map-bg)]",
        className,
      )}
      style={{
        height,
        // soft topo-feel: layered radial-gradient + faint contour grid
        backgroundImage: `
          radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 55%),
          radial-gradient(circle at 75% 80%, color-mix(in srgb, var(--muted) 70%, transparent), transparent 60%),
          repeating-linear-gradient(0deg, color-mix(in srgb, var(--fg) 4%, transparent) 0 1px, transparent 1px 32px),
          repeating-linear-gradient(90deg, color-mix(in srgb, var(--fg) 4%, transparent) 0 1px, transparent 1px 32px)
        `,
        backgroundColor: "var(--bg-elev)",
      }}
    >
      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        width={size.w}
        height={size.h}
        className="absolute inset-0 pointer-events-auto"
        role="img"
        aria-label="Газрын зураг — малын байршил"
      >
        {/* Zones */}
        {zones
          .filter((z) => z.active)
          .map((z) => {
            const points = z.coordinates
              .map(([la, lo]) => {
                const [x, y] = project(la, lo, bounds, size.w, size.h);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            const color = z.color ?? "#1d9e75";
            return (
              <polygon
                key={z.id}
                points={points}
                fill={color}
                fillOpacity={ZONE_FILL_OPACITY[z.type]}
                stroke={color}
                strokeWidth={z.type === "forbidden" ? 2 : 1.5}
                strokeDasharray={z.type === "forbidden" ? "6 4" : undefined}
                strokeOpacity={0.65}
              />
            );
          })}

        {/* Base camp marker */}
        <g aria-label="Бааз" transform={`translate(${baseX} ${baseY})`}>
          <circle r={11} fill="var(--bg)" stroke="var(--primary)" strokeWidth={3} />
          <circle r={4} fill="var(--primary)" />
        </g>

        {/* Route polyline + current position marker */}
        {routePath && routePath.length > 1 && (
          <>
            <polyline
              points={routePath
                .map((p) => {
                  const [x, y] = project(p.lat, p.lng, bounds, size.w, size.h);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2.5}
              strokeOpacity={0.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {(() => {
              const idx = Math.min(
                Math.max(0, routeCurrentIdx ?? routePath.length - 1),
                routePath.length - 1,
              );
              const p = routePath[idx];
              const [x, y] = project(p.lat, p.lng, bounds, size.w, size.h);
              return (
                <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                  <circle r={10} fill="var(--primary)" fillOpacity={0.2} />
                  <circle r={6} fill="var(--primary)" stroke="var(--bg)" strokeWidth={1.5} />
                </g>
              );
            })()}
          </>
        )}

        {/* Animal pins (hidden when in route mode unless selected) */}
        {(routePath
          ? animals.filter((a) => a.id === selectedAnimalId)
          : animals
        ).map((a) => {
          const [x, y] = project(a.lat, a.lng, bounds, size.w, size.h);
          const selected = selectedAnimalId === a.id;
          const r = selected ? 8 : a.status === "danger" ? 6 : 5;
          return (
            <g
              key={a.id}
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
              onClick={() => onAnimalClick?.(a.id)}
              style={{ cursor: onAnimalClick ? "pointer" : "default" }}
            >
              {selected && (
                <circle
                  r={r + 6}
                  fill={STATUS_COLOR[a.status]}
                  fillOpacity={0.2}
                />
              )}
              <circle
                r={r}
                fill={STATUS_COLOR[a.status]}
                stroke="var(--bg)"
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider bg-card/80 text-muted-foreground backdrop-blur border-card font-mono">
        зураг загвар
      </div>
    </div>
  );
}
