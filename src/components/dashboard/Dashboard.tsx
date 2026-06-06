"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Plus, Minus, Crosshair } from "lucide-react";
import { useAnimals, useZones, useOwner } from "@/lib/db/hooks";
import { MapView } from "@/components/map/MapView";
import { devicesApi, positionsApi, geofencesApi, tripsApi, type Device, type Geofence, type Position } from "@/lib/api";
import { AnimalStatusSheet } from "@/components/animal/AnimalStatusSheet";
import { DeviceSheet } from "@/components/devices/DeviceSheet";
import { Topbar, TopbarIcon } from "@/components/nav/Topbar";
import { UrgentRail } from "./UrgentRail";
import { mn } from "@/lib/i18n/mn";
import { cn, parseTraccarDeviceId } from "@/lib/utils";
import { getDb } from "@/lib/db";
import { pointInPolygon, distanceToPolygonM } from "@/lib/proximity";
import type { Animal } from "@/types/animal";
import type { Zone } from "@/types/zone";
import type { AlertPriority } from "@/types/alert";

type ZoneAlertStatus =
  | {
      active: true;
      priority: AlertPriority;
      title: string;
      message: string;
    }
  | { active: false };

export function Dashboard() {
  const router = useRouter();
  const animals = useAnimals();
  const zones = useZones();
  const owner = useOwner();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [recenter, setRecenter] = useState(0);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [zoomIn, setZoomIn] = useState(0);
  const [zoomOut, setZoomOut] = useState(0);
  const [focus, setFocus] = useState<{ token: number; lat?: number; lng?: number }>(
    { token: 0 },
  );

  const selected = useMemo(
    () => animals.find((a) => a.id === selectedId) ?? null,
    [animals, selectedId],
  );

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  const selectedPosition = useMemo(
    () => selectedDevice ? positions.find((p) => p.deviceId === selectedDevice.id) ?? null : null,
    [selectedDevice, positions],
  );

  const baseLat = owner?.baseLat ?? 48.3656312;
  const baseLng = owner?.baseLng ?? 106.7407558;
  const loc = `${owner?.aimag ?? "Төв"} · ${owner?.sum ?? "Батсүмбэр"}`;

  const counts = useMemo(() => {
    const c = { total: animals.length, warning: 0, danger: 0, safe: 0, offline: 0 };
    for (const a of animals) c[a.status]++;
    return c;
  }, [animals]);

  const customPolygons = useMemo<
    { id: string; coordinates: [number, number][]; color: string }[]
  >(
    () => [
      {
        id: "pasture-west",
        coordinates: [
          [47.1, 105.4],
          [48.4, 105.4],
          [48.4, 106.3],
          [47.1, 106.3],
        ],
        color: "#16a34a",
      },
      {
        id: "pasture-east",
        coordinates: [
          [47.1, 107.1],
          [48.4, 107.1],
          [48.4, 108.0],
          [47.1, 108.0],
        ],
        color: "#16a34a",
      },
    ],
    [],
  );

  const getZoneAlertStatus = (
    lat: number,
    lng: number,
    animal: Animal,
    zone: Zone,
  ): ZoneAlertStatus => {
    const inside = pointInPolygon(lat, lng, zone.coordinates);
    const distance = distanceToPolygonM(lat, lng, zone.coordinates);
    const animalLabel = animal.name ?? animal.id;
    const zoneLabel = zone.name || mn.zoneType[zone.type];

    if (zone.type === "forbidden") {
      if (inside) {
        return {
          active: true,
          priority: "critical",
          title: `${animalLabel} нь ${zoneLabel} хориглох бүс дотор орсон`,
          message: `${distance === 0 ? "" : `${Math.round(distance)}м зайтай`} GPS байршил нь энэ бүс рүү оржээ`,
        };
      }
      if (distance <= zone.bufferM) {
        return {
          active: true,
          priority: "high",
          title: `${animalLabel} нь ${zoneLabel} хориглох бүс рүү ойртсон`,
          message: `${Math.round(distance)}м зайтай ойртлоо`,
        };
      }
      return { active: false };
    }

    if (zone.type === "buffer") {
      if (inside) {
        return {
          active: true,
          priority: "medium",
          title: `${animalLabel} нь ${zoneLabel} ойрхон бүс дотор орсон`,
          message: `${Math.round(distance)}м зайтай хяналтын бүс дотор байна`,
        };
      }
      return { active: false };
    }

    if (zone.type === "pasture" || zone.type === "camp") {
      if (!inside && distance <= zone.bufferM) {
        return {
          active: true,
          priority: "medium",
          title: `${animalLabel} нь ${zoneLabel} хилийн ойролцоо байна`,
          message: `${Math.round(distance)}м зайтай хилийн захаас ойртжээ`,
        };
      }
      return { active: false };
    }

    return { active: false };
  };

  const focusAnimal = (id: string) => {
    setSelectedId(id);
    const a = animals.find((x) => x.id === id);
    if (!a) return;

    let lat = a.lat;
    let lng = a.lng;
    const device = devices.find((d) => d.uniqueId === a.deviceId);
    const traccarId = device?.id ?? parseTraccarDeviceId(a.deviceId);
    if (traccarId !== undefined) {
      const pos = positions.find((p) => p.deviceId === traccarId);
      if (pos) {
        lat = pos.latitude;
        lng = pos.longitude;
      }
    }

    setFocus((f) => ({ token: f.token + 1, lat, lng }));
  };

  useEffect(() => {
    geofencesApi.list().then(setGeofences).catch(() => setGeofences([]));

    let active = true;
    const loadDevices = async () => {
      try {
        const [deviceList, positionList] = await Promise.all([
          devicesApi.list(),
          positionsApi.latest(),
        ]);
        if (!active) return;
        setDevices(deviceList);
        setPositions(positionList);
      } catch {
        if (!active) return;
        setDevices([]);
        setPositions([]);
      }
    };

    loadDevices();
    const interval = window.setInterval(loadDevices, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      setRoutePoints([]);
      return;
    }

    const traccarDeviceId = parseTraccarDeviceId(selected.deviceId);
    if (traccarDeviceId === undefined) {
      setRoutePoints([]);
      return;
    }

    let active = true;
    setRouteLoading(true);
    const from = new Date();
    from.setDate(from.getDate() - 1);
    const to = new Date().toISOString();

    tripsApi.route(traccarDeviceId, from.toISOString(), to)
      .then((points) => {
        if (!active) return;
        setRoutePoints(points.map((p) => ({ lat: p.lat, lng: p.lng })));
      })
      .catch(() => {
        if (!active) return;
        setRoutePoints([]);
      })
      .finally(() => {
        if (!active) return;
        setRouteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selected]);

  useEffect(() => {
    const syncZoneAlerts = async () => {
      if (!animals.length || !zones.length) return;
      const db = getDb();
      const activeAlertIds = new Set<string>();
      const existingAlerts = await db.alerts.toArray();

      for (const animal of animals) {
        const traccarDeviceId = parseTraccarDeviceId(animal.deviceId);
        const position =
          traccarDeviceId !== undefined
            ? positions.find((p) => p.deviceId === traccarDeviceId)
            : undefined;
        const latitude = position?.latitude ?? animal.lat;
        const longitude = position?.longitude ?? animal.lng;

        if (latitude == null || longitude == null) continue;

        for (const zone of zones.filter((zone) => zone.active)) {
          const status = getZoneAlertStatus(latitude, longitude, animal, zone);
          const alertId = `zone-${animal.id}-${zone.id}`;
          if (!status.active) {
            continue;
          }

          activeAlertIds.add(alertId);
          const existing = existingAlerts.find((alert) => alert.id === alertId);
          const alertPayload = {
            id: alertId,
            type: "breach" as const,
            priority: status.priority,
            title: status.title,
            message: status.message,
            animalId: animal.id,
            deviceId: animal.deviceId,
            zoneId: zone.id,
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            resolvedAt: null,
            acknowledged: existing?.acknowledged ?? false,
            lat: latitude,
            lng: longitude,
          };

          if (
            !existing ||
            existing.resolvedAt ||
            existing.title !== alertPayload.title ||
            existing.message !== alertPayload.message ||
            existing.priority !== alertPayload.priority ||
            existing.lat !== alertPayload.lat ||
            existing.lng !== alertPayload.lng
          ) {
            await db.alerts.put(alertPayload);
          }
        }
      }

      for (const alert of existingAlerts) {
        if (alert.id.startsWith("zone-") && !activeAlertIds.has(alert.id) && !alert.resolvedAt) {
          await db.alerts.update(alert.id, {
            resolvedAt: new Date().toISOString(),
          });
        }
      }
    };

    syncZoneAlerts();
  }, [animals, positions, zones]);

  return (
    <div className="flex h-dvh flex-col">
      <Topbar
        title={mn.nav.home}
        sub={loc}
        right={
          <>
            <TopbarIcon aria-label="Хайх">
              <Search />
            </TopbarIcon>
            <TopbarIcon
              aria-label={mn.nav.alerts}
              dot
              onClick={() => router.push("/alerts")}
            >
              <Bell />
            </TopbarIcon>
          </>
        }
      />

      <div className="relative flex-1 overflow-hidden">
        <MapView
          className="absolute inset-0"
          animals={animals}
          zones={zones}
          geofences={geofences}
          devices={devices}
          positions={positions}
          customPolygons={customPolygons}
          baseLat={baseLat}
          baseLng={baseLng}
          selectedAnimalId={selectedId}
          onAnimalClick={focusAnimal}
          selectedDeviceId={selectedDeviceId}
          onDeviceClick={setSelectedDeviceId}
          recenterToken={recenter}
          zoomInToken={zoomIn}
          zoomOutToken={zoomOut}
          focusToken={focus.token}
          focusLat={focus.lat}
          focusLng={focus.lng}
          routePath={routePoints}
          routeCurrentIdx={routePoints.length - 1}
        />

        {/* Top overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3">
          {/* Status panel */}
          <div className="pointer-events-auto w-full rounded-xl border border-line bg-bg/95 p-4 shadow-lg backdrop-blur md:w-[300px]">
            <div className="font-mono text-xs text-mut">Сүргийн төлөв</div>
            <div className="mt-0.5 text-[17px] font-bold">{loc}</div>
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              <Stat v={counts.total} l="Нийт" />
              <Stat v={counts.safe} l="OK" tone="success" />
              <Stat v={counts.warning} l="Анхаар" tone="amber" />
              <Stat v={counts.danger} l="Давсан" tone="danger" />
            </div>
          </div>
        </div>

        {/* Map controls */}
        <div className="absolute right-3 bottom-[calc(env(safe-area-inset-bottom)+188px)] z-20 flex flex-col gap-1.5 md:bottom-[124px]">
          <MapBtn aria-label="Томруулах" onClick={() => setZoomIn((n) => n + 1)}>
            <Plus />
          </MapBtn>
          <MapBtn aria-label="Жижигрүүлэх" onClick={() => setZoomOut((n) => n + 1)}>
            <Minus />
          </MapBtn>
          <MapBtn
            aria-label="Хот руу буцах"
            onClick={() => setRecenter((n) => n + 1)}
          >
            <Crosshair />
          </MapBtn>
        </div>

        {/* Urgent card strip */}
        <UrgentRail
          animals={animals}
          devices={devices}
          positions={positions}
          selectedId={selectedId}
          onSelect={focusAnimal}
        />
      </div>

      <AnimalStatusSheet
        animal={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />

      <DeviceSheet
        device={selectedDevice}
        position={selectedPosition}
        open={selectedDevice !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDeviceId(null);
        }}
      />
    </div>
  );
}

function Stat({
  v,
  l,
  tone,
}: {
  v: number;
  l: string;
  tone?: "success" | "amber" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "amber"
        ? "text-amber"
        : tone === "success"
          ? "text-success"
          : "text-ink";
  return (
    <div className="rounded-[7px] border border-line bg-surface px-2 py-1.5 text-center">
      <div className={cn("font-mono text-lg font-bold leading-none", toneClass)}>
        {v}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-wide text-mut">
        {l}
      </div>
    </div>
  );
}

function MapBtn({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 shadow-sm transition-colors hover:bg-bg-2 active:scale-95 [&_svg]:size-4"
      {...props}
    >
      {children}
    </button>
  );
}
