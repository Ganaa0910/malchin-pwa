"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Bell, Plus, Minus, Crosshair } from "lucide-react";
import { useAnimals, usePolygons, useZones, useOwner } from "@/lib/db/hooks";
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

type Species = Animal["species"];
type SpeciesFilter = "all" | Species;

type ZoneAlertStatus =
  | {
      active: true;
      priority: AlertPriority;
      title: string;
      message: string;
    }
  | { active: false };

export function Dashboard() {
  const animals = useAnimals();
  const polygons = usePolygons();
  const zones = useZones();
  const owner = useOwner();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [species, setSpecies] = useState<SpeciesFilter>("all");
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

  // Species chips derived from the actual herd (БҮГД + present species).
  const speciesChips = useMemo(() => {
    const m = new Map<Species, number>();
    for (const a of animals) m.set(a.species, (m.get(a.species) ?? 0) + 1);
    return [...m.entries()];
  }, [animals]);

  const shown = useMemo(
    () => (species === "all" ? animals : animals.filter((a) => a.species === species)),
    [animals, species],
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
    const traccarId = parseTraccarDeviceId(a.deviceId);
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
        live="LIVE · 2с"
        right={
          <>
            <TopbarIcon aria-label="Хайх">
              <Search />
            </TopbarIcon>
            <TopbarIcon aria-label={mn.nav.alerts} dot>
              <Bell />
            </TopbarIcon>
          </>
        }
      />

      <div className="relative flex-1 overflow-hidden">
        <MapView
          className="absolute inset-0"
          animals={shown}
          zones={zones}
          geofences={geofences}
          devices={devices}
          positions={positions}
          customPolygons={polygons.filter((poly) => poly.active)}
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

        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap gap-2 md:left-6 md:right-auto">
          <div className="pointer-events-auto flex gap-1 overflow-x-auto rounded-[10px] border border-line bg-bg/95 p-1.5 shadow-lg">
            <SpeciesChip
              label={mn.herd.filterAll}
              count={counts.total}
              active={species === "all"}
              onClick={() => setSpecies("all")}
            />
            {speciesChips.map(([sp, n]) => (
              <SpeciesChip
                key={sp}
                label={mn.species[sp].toUpperCase()}
                count={n}
                active={species === sp}
                onClick={() => setSpecies(sp)}
              />
            ))}
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
          animals={shown}
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

function SpeciesChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-colors",
        active ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface",
      )}
    >
      {label}
      <span className="opacity-60">{count}</span>
    </button>
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
