"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngBoundsLiteral, Map as LeafletMap } from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Satellite, Map as MapIcon, Mountain, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Animal, AnimalStatus } from "@/types/animal";
import type { Zone } from "@/types/zone";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";

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

// Google tile basemaps (no API key; fine for local/demo). lyrs: y=hybrid
// satellite, m=roadmap, p=terrain.
type LayerKey = "satellite" | "roadmap" | "terrain";

const LAYERS: Record<LayerKey, { label: string; lyrs: string; Icon: LucideIcon }> = {
  satellite: { label: mn.map.satellite, lyrs: "y", Icon: Satellite },
  roadmap: { label: mn.map.roadmap, lyrs: "m", Icon: MapIcon },
  terrain: { label: mn.map.terrain, lyrs: "p", Icon: Mountain },
};
const LAYER_ORDER: LayerKey[] = ["satellite", "roadmap", "terrain"];

const tileUrl = (key: LayerKey) =>
  `https://{s}.google.com/vt/lyrs=${LAYERS[key].lyrs}&x={x}&y={y}&z={z}`;
const TILE_SUBDOMAINS = ["mt0", "mt1", "mt2", "mt3"];

const ATTR = '&copy; <a href="https://www.google.com/maps">Google</a>';

const LAYER_STORAGE_KEY = "malchin.mapLayer";

function readSavedLayer(): LayerKey {
  if (typeof window === "undefined") return "satellite";
  const saved = window.localStorage.getItem(LAYER_STORAGE_KEY);
  return saved && saved in LAYERS ? (saved as LayerKey) : "satellite";
}

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
  /** Increment to zoom in / out by one step. */
  zoomInToken?: number;
  zoomOutToken?: number;
  /** When this token changes, pan to focusLat/focusLng. */
  focusToken?: number;
  focusLat?: number;
  focusLng?: number;
  /** User-drawn custom polygons to render (selectable). */
  customPolygons?: { id: string; coordinates: [number, number][]; color?: string }[];
  selectedPolygonId?: string | null;
  onPolygonClick?: (id: string) => void;
  /** Draw mode: in-progress polygon vertices + map-click handler. */
  draftPolygon?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
}

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
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

/** Keeps Leaflet's canvas in sync with its container size (sidebar toggles, etc.). */
function SizeWatcher() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
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

function ZoomController({
  inToken,
  outToken,
}: {
  inToken: number;
  outToken: number;
}) {
  const map = useMap();
  const seenIn = useRef(inToken);
  const seenOut = useRef(outToken);
  useEffect(() => {
    if (inToken === seenIn.current) return;
    seenIn.current = inToken;
    map.zoomIn();
  }, [inToken, map]);
  useEffect(() => {
    if (outToken === seenOut.current) return;
    seenOut.current = outToken;
    map.zoomOut();
  }, [outToken, map]);
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
  zoomInToken = 0,
  zoomOutToken = 0,
  focusToken = 0,
  focusLat,
  focusLng,
  customPolygons,
  selectedPolygonId = null,
  onPolygonClick,
  draftPolygon,
  onMapClick,
}: MapViewLeafletProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [layer, setLayer] = useState<LayerKey>(readSavedLayer);

  function changeLayer(next: LayerKey) {
    setLayer(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAYER_STORAGE_KEY, next);
    }
  }

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
    <>
      <LayerControl active={layer} onChange={changeLayer} />
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [28, 28] }}
        className="h-full w-full"
        zoomControl={false}
        attributionControl
        scrollWheelZoom
        ref={mapRef}
      >
      <SizeWatcher />
      <BoundsFlyer bounds={bounds} />
      <RecenterController token={recenterToken} lat={baseLat} lng={baseLng} />
      <ZoomController inToken={zoomInToken} outToken={zoomOutToken} />
      <FocusController token={focusToken} lat={focusLat} lng={focusLng} />
      {onMapClick && <MapClickHandler onClick={onMapClick} />}
      <TileLayer
        key={layer}
        url={tileUrl(layer)}
        attribution={ATTR}
        subdomains={TILE_SUBDOMAINS}
        maxZoom={20}
      />

      {/* User-drawn custom polygons */}
      {customPolygons?.map((poly) => {
        const color = poly.color ?? "#16a34a";
        const selected = poly.id === selectedPolygonId;
        return (
          <Polygon
            key={poly.id}
            positions={poly.coordinates}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: selected ? 0.25 : 0.12,
              weight: selected ? 3 : 1.75,
              opacity: selected ? 1 : 0.8,
            }}
            eventHandlers={{ click: () => onPolygonClick?.(poly.id) }}
          />
        );
      })}

      {/* In-progress draft polygon */}
      {draftPolygon && draftPolygon.length > 0 && (
        <>
          {draftPolygon.length >= 3 && (
            <Polygon
              positions={draftPolygon}
              pathOptions={{
                color: "#16a34a",
                fillColor: "#16a34a",
                fillOpacity: 0.15,
                weight: 2,
                dashArray: "6 4",
              }}
            />
          )}
          {draftPolygon.length < 3 && draftPolygon.length > 1 && (
            <Polyline
              positions={draftPolygon}
              pathOptions={{ color: "#16a34a", weight: 2, dashArray: "6 4" }}
            />
          )}
          {draftPolygon.map((pt, i) => (
            <CircleMarker
              key={`draft-${i}`}
              center={pt}
              radius={5}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#16a34a",
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}
        </>
      )}

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
    </>
  );
}

/** Google-style basemap switcher — compact button that expands to layer options. */
function LayerControl({
  active,
  onChange,
}: {
  active: LayerKey;
  onChange: (key: LayerKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ActiveIcon = LAYERS[active].Icon;

  return (
    <div className="absolute right-2 top-2 z-[1000] flex flex-col items-end pt-safe">
      <button
        type="button"
        aria-label={mn.map.layer}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "tap flex size-11 items-center justify-center rounded-full",
          "border bg-background/95 backdrop-blur shadow-sm",
          "hover:bg-accent active:scale-95 transition",
        )}
      >
        <ActiveIcon className="size-5" />
      </button>

      {open && (
        <ul className="mt-2 w-44 overflow-hidden rounded-xl border bg-background/95 backdrop-blur shadow-md">
          {LAYER_ORDER.map((key) => {
            const { label, Icon } = LAYERS[key];
            const selected = key === active;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "tap flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    selected
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", selected && "text-primary")} />
                  <span className="flex-1 text-left">{label}</span>
                  {selected && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
