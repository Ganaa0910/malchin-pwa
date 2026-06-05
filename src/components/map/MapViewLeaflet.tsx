"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngBoundsLiteral, Map as LeafletMap } from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Polyline,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Satellite, Map as MapIcon, Mountain, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Animal, AnimalStatus } from "@/types/animal";
import type { Zone } from "@/types/zone";
import type { Device, Geofence, Position } from "@/lib/api";
import { parseWktPolygon } from "@/lib/wkt";
import { cn, parseTraccarDeviceId } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import { timeAgoMn } from "@/lib/time";

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
  `https://{s}.google.com/vt/lyrs=${LAYERS[key].lyrs}&hl=mn&gl=MN&x={x}&y={y}&z={z}`;
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
  onDeviceClick?: (deviceId: number) => void;
  selectedDeviceId?: number | null;
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
  geofences?: Geofence[];
  devices?: Device[];
  positions?: Position[];
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
  geofences?: Geofence[],
  customPolygons?: { id: string; coordinates: [number, number][] }[],
  positions?: Position[],
): LatLngBoundsLiteral {
  const startLat = isValidPoint(baseLat, baseLng) ? baseLat : 0;
  const startLng = isValidPoint(baseLat, baseLng) ? baseLng : 0;

  let minLat = startLat,
    maxLat = startLat,
    minLng = startLng,
    maxLng = startLng;
  for (const z of zones) {
    if (!z.active) continue;
    for (const [la, lo] of z.coordinates) {
      if (!isValidPoint(la, lo)) continue;
      if (la < minLat) minLat = la;
      if (la > maxLat) maxLat = la;
      if (lo < minLng) minLng = lo;
      if (lo > maxLng) maxLng = lo;
    }
  }
  for (const a of animals) {
    if (!isValidPoint(a.lat, a.lng)) continue;
    if (a.lat < minLat) minLat = a.lat;
    if (a.lat > maxLat) maxLat = a.lat;
    if (a.lng < minLng) minLng = a.lng;
    if (a.lng > maxLng) maxLng = a.lng;
  }
  for (const g of geofences ?? []) {
    for (const pt of parseWktPolygon(g.area)) {
      if (!isValidPoint(pt.lat, pt.lng)) continue;
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lng < minLng) minLng = pt.lng;
      if (pt.lng > maxLng) maxLng = pt.lng;
    }
  }
  for (const poly of customPolygons ?? []) {
    for (const [lat, lng] of poly.coordinates) {
      if (!isValidPoint(lat, lng)) continue;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  }
  for (const pos of positions ?? []) {
    if (!isValidPoint(pos.latitude, pos.longitude)) continue;
    if (pos.latitude < minLat) minLat = pos.latitude;
    if (pos.latitude > maxLat) maxLat = pos.latitude;
    if (pos.longitude < minLng) minLng = pos.longitude;
    if (pos.longitude > maxLng) maxLng = pos.longitude;
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

function isValidPoint(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function isValidBounds(bounds: LatLngBoundsLiteral) {
  return (
    Array.isArray(bounds) &&
    bounds.length === 2 &&
    bounds.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        pair.every((value) => Number.isFinite(value)),
    )
  );
}

function pointsBounds(
  points: { lat: number; lng: number }[],
): LatLngBoundsLiteral {
  const validPoints = points.filter((p) => isValidPoint(p.lat, p.lng));
  if (validPoints.length === 0) {
    return [
      [0, 0],
      [0, 0],
    ];
  }

  let minLat = validPoints[0].lat,
    maxLat = validPoints[0].lat,
    minLng = validPoints[0].lng,
    maxLng = validPoints[0].lng;
  for (const p of validPoints) {
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
    if (!isValidBounds(bounds)) return;
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

/** Flies the map to fit the currently selected fence so it's easy to find. */
function SelectedPolygonFlyer({
  selectedId,
  polygons,
}: {
  selectedId: string | null;
  polygons?: { id: string; coordinates: [number, number][] }[];
}) {
  const map = useMap();
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedId) {
      seen.current = null;
      return;
    }
    if (selectedId === seen.current) return;
    const poly = polygons?.find((p) => p.id === selectedId);
    if (!poly || poly.coordinates.length === 0) return;

    const validCoords = poly.coordinates.filter(([lat, lng]) => isValidPoint(lat, lng));
    if (validCoords.length === 0) return;

    seen.current = selectedId;

    let minLat = validCoords[0][0],
      minLng = validCoords[0][1],
      maxLat = validCoords[0][0],
      maxLng = validCoords[0][1];
    for (const [lat, lng] of validCoords) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
    const bounds: LatLngBoundsLiteral = [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
    if (!isValidBounds(bounds)) return;
    map.flyToBounds(bounds, { padding: [48, 48], duration: 0.45, maxZoom: 15 });
  }, [selectedId, polygons, map]);
  return null;
}

export default function MapViewLeaflet({
  animals,
  zones,
  geofences,
  devices,
  positions,
  baseLat,
  baseLng,
  onAnimalClick,
  selectedAnimalId = null,
  onDeviceClick,
  selectedDeviceId = null,
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
  const [layer, setLayer] = useState<LayerKey>(readSavedLayer);

  function changeLayer(next: LayerKey) {
    setLayer(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAYER_STORAGE_KEY, next);
    }
  }

  const bounds = useMemo(() => {
    const rawBounds =
      routePath && routePath.length > 0
        ? pointsBounds(routePath)
        : calcBounds(zones, animals, baseLat, baseLng, geofences, customPolygons, positions);
    const fallback: LatLngBoundsLiteral = [
      [baseLat, baseLng],
      [baseLat, baseLng],
    ];
    return isValidBounds(rawBounds) ? rawBounds : fallback;
  }, [zones, animals, baseLat, baseLng, routePath, geofences, customPolygons, positions]);

  const visibleAnimals = useMemo(() => {
    if (routePath && routePath.length > 0) {
      return animals.filter((a) => a.id === selectedAnimalId);
    }
    return animals;
  }, [animals, selectedAnimalId, routePath]);

  const positionByDevice = useMemo(() => {
    const map: Record<number | string, Position> = {};
    for (const pos of positions ?? []) {
      map[pos.deviceId] = pos;
    }
    return map;
  }, [positions]);

  const deviceById = useMemo(() => {
    const map: Record<number, Device> = {};
    for (const device of devices ?? []) {
      map[device.id] = device;
    }
    return map;
  }, [devices]);

  const deviceByUniqueId = useMemo(() => {
    const map: Record<string, Device> = {};
    for (const device of devices ?? []) {
      if (device.uniqueId) map[device.uniqueId] = device;
    }
    return map;
  }, [devices]);

  // Resolve an animal's deviceId to the live Traccar numeric id. Prefer matching
  // the device by uniqueId (e.g. "COW001"); fall back to the "D-T-<id>"/"D-<id>"
  // id convention for animals that encode the numeric id directly.
  const resolveDeviceId = (deviceId?: string | null): number | undefined =>
    (deviceId ? deviceByUniqueId[deviceId]?.id : undefined) ??
    parseTraccarDeviceId(deviceId);

  const deviceIdsWithAnimals = useMemo(() => {
    const set = new Set<number>();
    for (const animal of animals) {
      const id = resolveDeviceId(animal.deviceId);
      if (id !== undefined) set.add(id);
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animals, deviceByUniqueId]);

  const visibleDevices = useMemo(() => {
    if (!devices) return [] as Device[];
    return devices.filter((device) => {
      if (!deviceIdsWithAnimals.has(device.id)) return true;
      const animal = animals.find((a) => resolveDeviceId(a.deviceId) === device.id);
      if (!animal) return true;
      const pos = positionByDevice[device.id];
      const placeable =
        (pos && isValidPoint(pos.latitude, pos.longitude)) ||
        isValidPoint(animal.lat, animal.lng);
      return !placeable;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animals, devices, deviceIdsWithAnimals, positionByDevice, deviceByUniqueId]);

  function statusColor(status?: string) {
    if (status === "online") return STATUS_COLOR.safe;
    if (status === "offline") return STATUS_COLOR.offline;
    return STATUS_COLOR.warning;
  }

  return (
    <>
      <LayerControl active={layer} onChange={changeLayer} />
      <MapContainer
        center={[baseLat, baseLng]}
        zoom={13}
        minZoom={2}
        maxZoom={20}
        maxBounds={[[40, 87], [52.5, 120]]}
        maxBoundsViscosity={0.75}
        className="h-full w-full"
        zoomControl={false}
        attributionControl
        scrollWheelZoom
      >
      <SizeWatcher />
      <BoundsFlyer bounds={bounds} />
      <RecenterController token={recenterToken} lat={baseLat} lng={baseLng} />
      <ZoomController inToken={zoomInToken} outToken={zoomOutToken} />
      <FocusController token={focusToken} lat={focusLat} lng={focusLng} />
      <SelectedPolygonFlyer
        selectedId={selectedPolygonId}
        polygons={customPolygons}
      />
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
        const dimmed = selectedPolygonId != null && !selected;
        return (
          <Polygon
            key={poly.id}
            positions={poly.coordinates}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: selected ? 0.35 : dimmed ? 0.05 : 0.12,
              weight: selected ? 4 : 1.75,
              opacity: selected ? 1 : dimmed ? 0.4 : 0.8,
              dashArray: selected ? undefined : dimmed ? "4 4" : undefined,
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

      {geofences?.map((g) => {
        const coords = parseWktPolygon(g.area);
        if (coords.length < 3) return null;
        return (
          <Polygon
            key={`geofence-${g.id}`}
            positions={coords.map((c) => [c.lat, c.lng] as [number, number])}
            pathOptions={{
              color: "#E24B4A",
              fillColor: "#E24B4A",
              fillOpacity: 0.08,
              weight: 1.75,
              opacity: 0.8,
              dashArray: "6 4",
            }}
          />
        );
      })}

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
        const deviceKey = resolveDeviceId(a.deviceId);
        const devicePos = deviceKey !== undefined ? positionByDevice[deviceKey] : undefined;
        const centerLat = devicePos?.latitude ?? a.lat;
        const centerLng = devicePos?.longitude ?? a.lng;
        if (!isValidPoint(centerLat, centerLng)) return null;
        return (
          <CircleMarker
            key={`animal-${a.id}`}
            center={[centerLat, centerLng]}
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
          >
            <Tooltip direction="top" offset={[0, -r]} sticky>
              <div className="text-xs leading-tight">
                <div className="font-semibold truncate">{a.name ?? a.id}</div>
                <div>{devicePos ? `${devicePos.speed.toFixed(1)} км/ц` : "Хурд: —"}</div>
                <div>{timeAgoMn(devicePos?.fixTime ?? a.lastSeenAt)}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {visibleDevices.map((device) => {
        const pos = positionByDevice[device.id];
        // Use position data if available, otherwise fall back to base location
        const lat = pos?.latitude ?? baseLat;
        const lng = pos?.longitude ?? baseLng;
        
        if (!isValidPoint(lat, lng)) return null;
        
        const selected = device.id === selectedDeviceId;
        return (
          <CircleMarker
            key={`device-${device.id}`}
            center={[lat, lng]}
            radius={selected ? 7 : 5}
            pathOptions={{
              color: "#ffffff",
              fillColor: statusColor(device.status),
              fillOpacity: 1,
              weight: selected ? 2.5 : 1.5,
            }}
            eventHandlers={{
              click: () => onDeviceClick?.(device.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -5]} sticky>
              <div className="text-xs leading-tight">
                <div className="font-semibold truncate">{device.name}</div>
                <div>{pos ? `${pos.speed.toFixed(1)} км/ц` : "Хурд: —"}</div>
                <div className="uppercase">{device.status}</div>
              </div>
            </Tooltip>
          </CircleMarker>
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
