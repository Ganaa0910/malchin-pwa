"use client";

/**
 * TraccarMap — Full-featured Leaflet map component
 *
 * Features:
 *  • Live device positions with cow icons + names
 *  • All geofences drawn as polygons with names
 *  • Click device → show info popup
 *  • Auto-refreshes positions every 10s
 *
 * Usage in any page:
 *   import TraccarMap from "@/components/map/TraccarMap";
 *   <TraccarMap className="h-[500px]" />
 *
 * Drop into: src/components/map/TraccarMap.tsx
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { devicesApi, positionsApi, geofencesApi, type Device, type Position, type Geofence } from "@/lib/api";
import { parseWktPolygon, polygonCentroid } from "@/lib/wkt";

interface TraccarMapProps {
  className?: string;
  /** If provided, only show this device */
  deviceId?: number;
  /** Show route trail for history mode */
  routePoints?: Array<{ lat: number; lng: number }>;
}

const COW_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#4CAF50" opacity="0.9"/>
  <text x="16" y="21" text-anchor="middle" font-size="16">🐄</text>
</svg>`;

const OFFLINE_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#9E9E9E" opacity="0.9"/>
  <text x="16" y="21" text-anchor="middle" font-size="16">🐄</text>
</svg>`;

export default function TraccarMap({ className = "h-full w-full", deviceId, routePoints }: TraccarMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const geofenceLayersRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ── Init Leaflet ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    import("leaflet").then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Centre on Mongolia
      const map = L.map(mapRef.current!, {
        center: [47.5, 106.9],
        zoom: 7,
        minZoom: 2,
        maxZoom: 19,
        maxBounds: [[40, 87], [52.5, 120]],
        maxBoundsViscosity: 0.75,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // ── Draw geofences ────────────────────────────────────────────────────────
  const drawGeofences = useCallback((L: any, geoList: Geofence[]) => {
    // Remove old
    geofenceLayersRef.current.forEach(l => l.remove());
    geofenceLayersRef.current = [];

    geoList.forEach(g => {
      const coords = parseWktPolygon(g.area);
      if (coords.length < 3) return;
      const latlngs = coords.map(c => [c.lat, c.lng] as [number, number]);

      const poly = L.polygon(latlngs, {
        color: "#E24B4A",
        weight: 2,
        opacity: 0.8,
        fillColor: "#E24B4A",
        fillOpacity: 0.1,
        dashArray: "6 4",
      }).addTo(leafletMap.current!);

      const centre = polygonCentroid(coords);
      const label = L.divIcon({
        className: "",
        html: `<div style="background:rgba(226,75,74,0.85);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;">${g.name}</div>`,
        iconAnchor: [0, 0],
      });
      const labelMarker = L.marker([centre.lat, centre.lng], { icon: label, interactive: false })
        .addTo(leafletMap.current!);

      poly.bindPopup(`<b>${g.name}</b>${g.description ? `<br/>${g.description}` : ""}`);
      geofenceLayersRef.current.push(poly, labelMarker);
    });
  }, []);

  // ── Draw device markers ───────────────────────────────────────────────────
  const drawDevices = useCallback((L: any, devList: Device[], posList: Position[]) => {
    const posMap: Record<number, Position> = {};
    posList.forEach(p => { posMap[p.deviceId] = p; });

    const bounds: [number, number][] = [];

    devList.forEach(dev => {
      const pos = posMap[dev.id];
      if (!pos) return;

      const isOnline = dev.status === "online";
      const iconHtml = isOnline ? COW_ICON_SVG : OFFLINE_ICON_SVG;
      const icon = L.divIcon({
        html: `<div style="position:relative">
          ${iconHtml}
          <div style="position:absolute;top:34px;left:50%;transform:translateX(-50%);
            background:rgba(0,0,0,0.75);color:#fff;padding:1px 6px;border-radius:3px;
            font-size:11px;white-space:nowrap;font-weight:500;">${dev.name}</div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "",
      });

      const popupContent = `
        <div style="min-width:160px">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px">${dev.name}</div>
          <div style="font-size:12px;color:#555">
            <div>📍 ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}</div>
            <div>🚀 ${(pos.speed).toFixed(1)} km/h</div>
            <div>🕒 ${new Date(pos.fixTime).toLocaleTimeString()}</div>
            <div>📡 ${isOnline ? "🟢 Онлайн" : "⚫ Офлайн"}</div>
            ${pos.address ? `<div>📮 ${pos.address}</div>` : ""}
          </div>
        </div>`;

      if (markersRef.current[dev.id]) {
        markersRef.current[dev.id].setLatLng([pos.latitude, pos.longitude]);
        markersRef.current[dev.id].setIcon(icon);
        markersRef.current[dev.id].setPopupContent(popupContent);
      } else {
        const marker = L.marker([pos.latitude, pos.longitude], { icon })
          .addTo(leafletMap.current!)
          .bindPopup(popupContent);
        markersRef.current[dev.id] = marker;
      }
      bounds.push([pos.latitude, pos.longitude]);
    });

    // Remove markers for deleted devices
    Object.keys(markersRef.current).forEach(idStr => {
      const id = Number(idStr);
      if (!devList.find(d => d.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    return bounds;
  }, []);

  // ── Draw route (history mode) ─────────────────────────────────────────────
  const getBoundPoints = useCallback((geoList: Geofence[]) => {
    const points: [number, number][] = [];
    geoList.forEach((g) => {
      const coords = parseWktPolygon(g.area);
      coords.forEach((pt) => {
        points.push([pt.lat, pt.lng]);
      });
    });
    return points;
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !routePoints?.length) return;
    import("leaflet").then(L => {
      routeLayerRef.current?.remove();
      const layerGroup = L.layerGroup().addTo(leafletMap.current!);
      const latlngs = routePoints.map(p => [p.lat, p.lng] as [number, number]);
      const routeLine = L.polyline(latlngs, {
        color: "#2196F3",
        weight: 3,
        opacity: 0.8,
      }).addTo(layerGroup);

      // Start/end markers
      if (latlngs.length > 0) {
        L.circleMarker(latlngs[0], { radius: 8, color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 1 })
          .bindPopup("Эхлэл")
          .addTo(layerGroup);
        L.circleMarker(latlngs[latlngs.length - 1], { radius: 8, color: "#F44336", fillColor: "#F44336", fillOpacity: 1 })
          .bindPopup("Төгсгөл")
          .addTo(layerGroup);

        const geoBounds = getBoundPoints(geofences);
        const bounds = geoBounds.length > 0 ? [...latlngs, ...geoBounds] : latlngs;
        leafletMap.current!.fitBounds(bounds);
      }

      routeLayerRef.current = layerGroup;
    });
  }, [routePoints, geofences, getBoundPoints]);

  // ── Load data & refresh ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [devList, posList, geoList] = await Promise.all([
        devicesApi.list(),
        deviceId ? positionsApi.live(deviceId) : positionsApi.latest(),
        geofencesApi.list(),
      ]);

      setDevices(devList);
      setPositions(posList);
      setGeofences(geoList);
      setLastUpdate(new Date());

      if (!leafletMap.current) return;
      const L = (await import("leaflet")).default ?? await import("leaflet");
      drawGeofences(L, geoList);
      drawDevices(L, devList, posList);
    } catch (err) {
      console.error("TraccarMap load error:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, drawGeofences, drawDevices]);

  useEffect(() => {
    // Wait for map to init
    const timer = setTimeout(() => {
      loadData();
      const interval = setInterval(loadData, 10_000);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  return (
    <div className="relative w-full h-full">
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />

      <div ref={mapRef} className={className} style={{ zIndex: 0 }} />

      {/* Status bar */}
      <div className="absolute bottom-2 left-2 z-[999] flex gap-2 items-center">
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs shadow flex gap-3 items-center">
          <span className="font-medium">{devices.length} бод мал</span>
          <span className="text-zinc-400">|</span>
          <span>{geofences.length} хориглох бүс</span>
          {lastUpdate && (
            <>
              <span className="text-zinc-400">|</span>
              <span className="text-zinc-500">
                {lastUpdate.toLocaleTimeString()} шинэчлэгдсэн
              </span>
            </>
          )}
        </div>
        {loading && (
          <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg shadow animate-pulse">
            Ачааллаж байна…
          </div>
        )}
      </div>
    </div>
  );
}
