"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LatLngBoundsLiteral, Map as LeafletMap } from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { Animal, AnimalStatus } from "@/types/animal";
import type { Zone } from "@/types/zone";

const STATUS_COLOR: Record<AnimalStatus, string> = {
  safe: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
  offline: "#a1a1aa",
};

const ZONE_COLOR: Record<Zone["type"], string> = {
  pasture: "#16a34a",
  camp: "#0ea5e9",
  forbidden: "#ef4444",
  buffer: "#a1a1aa",
};

// Google Maps roadmap tiles (lyrs=m). No API key; fine for local/demo use.
const TILE_URL = "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
const TILE_SUBDOMAINS = ["mt0", "mt1", "mt2", "mt3"];

const ATTR = '&copy; <a href="https://www.google.com/maps">Google</a>';

export interface MapViewLeafletProps {
  animals: Animal[];
  zones: Zone[];
  baseLat: number;
  baseLng: number;
  onAnimalClick?: (id: string) => void;
  selectedAnimalId?: string | null;
  routePath?: { lat: number; lng: number }[];
  routeCurrentIdx?: number;
  /** Increment to recenter on base camp. */
  recenterToken?: number;
  /** When this token changes, pan to focusLat/focusLng. */
  focusToken?: number;
  focusLat?: number;
  focusLng?: number;
}

function calcBounds(
  zones: Zone[],
  animals: Animal[],
  baseLat: number,
  baseLng: number,
): LatLngBoundsLiteral {
  let minLat = baseLat,
    maxLat = baseLat,
    minLng = baseLng,
    maxLng = baseLng;
  for (const z of zones) {
    if (!z.active) continue;
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
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

function pointsBounds(
  points: { lat: number; lng: number }[],
): LatLngBoundsLiteral {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

function BoundsFlyer({ bounds }: { bounds: LatLngBoundsLiteral }) {
  const map = useMap();
  const lastKey = useRef<string>("");
  useEffect(() => {
    const key = JSON.stringify(bounds);
    if (key === lastKey.current) return;
    lastKey.current = key;
    map.flyToBounds(bounds, { padding: [28, 28], duration: 0.4 });
  }, [map, bounds]);
  return null;
}

function RecenterController({
  token,
  lat,
  lng,
}: {
  token: number;
  lat: number;
  lng: number;
}) {
  const map = useMap();
  const seen = useRef<number>(token);
  useEffect(() => {
    if (token === seen.current) return;
    seen.current = token;
    map.flyTo([lat, lng], 13, { duration: 0.5 });
  }, [token, lat, lng, map]);
  return null;
}

function FocusController({
  token,
  lat,
  lng,
}: {
  token: number;
  lat?: number;
  lng?: number;
}) {
  const map = useMap();
  const seen = useRef<number>(token);
  useEffect(() => {
    if (token === seen.current) return;
    if (lat === undefined || lng === undefined) return;
    seen.current = token;
    const targetZoom = Math.max(map.getZoom(), 14);
    map.flyTo([lat, lng], targetZoom, { duration: 0.5 });
  }, [token, lat, lng, map]);
  return null;
}

export default function MapViewLeaflet({
  animals,
  zones,
  baseLat,
  baseLng,
  onAnimalClick,
  selectedAnimalId = null,
  routePath,
  routeCurrentIdx,
  recenterToken = 0,
  focusToken = 0,
  focusLat,
  focusLng,
}: MapViewLeafletProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  const bounds = useMemo(() => {
    if (routePath && routePath.length > 0) return pointsBounds(routePath);
    return calcBounds(zones, animals, baseLat, baseLng);
  }, [zones, animals, baseLat, baseLng, routePath]);

  const visibleAnimals = useMemo(() => {
    if (routePath && routePath.length > 0) {
      return animals.filter((a) => a.id === selectedAnimalId);
    }
    return animals;
  }, [animals, selectedAnimalId, routePath]);

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [28, 28] }}
      className="h-full w-full"
      zoomControl={false}
      attributionControl
      scrollWheelZoom
      ref={mapRef}
    >
      <BoundsFlyer bounds={bounds} />
      <RecenterController token={recenterToken} lat={baseLat} lng={baseLng} />
      <FocusController token={focusToken} lat={focusLat} lng={focusLng} />
      <TileLayer
        url={TILE_URL}
        attribution={ATTR}
        subdomains={TILE_SUBDOMAINS}
        maxZoom={20}
      />

      {zones
        .filter((z) => z.active)
        .map((z) => {
          const color = ZONE_COLOR[z.type] ?? "#16a34a";
          return (
            <Polygon
              key={z.id}
              positions={z.coordinates}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: z.type === "forbidden" ? 0.06 : 0.1,
                dashArray: z.type === "forbidden" ? "6 4" : undefined,
                weight: 1.5,
                opacity: 0.65,
              }}
            />
          );
        })}

      <CircleMarker
        center={[baseLat, baseLng]}
        radius={7}
        pathOptions={{
          color: "#09090b",
          fillColor: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        }}
      />

      {visibleAnimals.map((a) => {
        const selected = a.id === selectedAnimalId;
        const r = selected ? 8 : a.status === "danger" ? 5 : 4;
        return (
          <CircleMarker
            key={a.id}
            center={[a.lat, a.lng]}
            radius={r}
            pathOptions={{
              color: "#ffffff",
              fillColor: STATUS_COLOR[a.status],
              fillOpacity: 1,
              weight: selected ? 2.5 : 1.25,
            }}
            eventHandlers={{
              click: () => onAnimalClick?.(a.id),
            }}
          />
        );
      })}

      {routePath && routePath.length > 1 && (
        <>
          <Polyline
            positions={routePath.map(
              (p) => [p.lat, p.lng] as [number, number],
            )}
            pathOptions={{
              color: STATUS_COLOR.safe,
              weight: 2.5,
              opacity: 0.85,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          {(() => {
            const idx = Math.min(
              Math.max(0, routeCurrentIdx ?? routePath.length - 1),
              routePath.length - 1,
            );
            const p = routePath[idx];
            return (
              <CircleMarker
                center={[p.lat, p.lng]}
                radius={7}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: STATUS_COLOR.safe,
                  fillOpacity: 1,
                  weight: 2.5,
                }}
              />
            );
          })()}
        </>
      )}
    </MapContainer>
  );
}
