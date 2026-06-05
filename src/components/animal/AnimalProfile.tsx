"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useAnimal, useDevice } from "@/lib/db/hooks";
import { RoutePlayback } from "@/components/animal/RoutePlayback";
import { EventLog } from "@/components/animal/EventLog";
import { Topbar } from "@/components/nav/Topbar";
import { mn } from "@/lib/i18n/mn";
import { cn, parseTraccarDeviceId } from "@/lib/utils";
import { devicesApi, positionsApi, tripsApi, type Position } from "@/lib/api";
import type { AnimalStatus, Species } from "@/types/animal";

const SPECIES_EMOJI: Record<Species, string> = {
  үхэр: "🐄",
  хонь: "🐑",
  ямаа: "🐐",
  морь: "🐎",
};

const STATUS_BADGE: Record<AnimalStatus, { label: string; cls: string }> = {
  danger: { label: mn.herd.groupDanger, cls: "bg-danger-soft text-danger" },
  warning: { label: mn.herd.groupWarning, cls: "bg-amber-soft text-amber" },
  safe: { label: mn.status.safe, cls: "bg-success-soft text-success" },
  offline: { label: mn.status.offline, cls: "bg-bg-2 text-mut" },
};

function batteryColor(b: number): string {
  if (b < 15) return "text-danger";
  if (b < 30) return "text-amber";
  return "text-success";
}

function signalLabel(s: number): { v: string; cls: string } {
  if (s >= 66) return { v: "Хүчтэй", cls: "text-success" };
  if (s >= 33) return { v: "Дунд", cls: "text-amber" };
  return { v: "Сул", cls: "text-danger" };
}

export function AnimalProfile({ id }: { id: string }) {
  const animal = useAnimal(id);
  const device = useDevice(animal?.deviceId);
  const [liveDevice, setLiveDevice] = useState<any>(null);
  const [livePosition, setLivePosition] = useState<Position | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number; ts?: string; speedKmh?: number }>>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (!animal?.deviceId) {
      setLiveDevice(null);
      setLivePosition(null);
      return;
    }

    const traccarId = parseTraccarDeviceId(animal.deviceId);
    if (!traccarId) {
      setLiveDevice(null);
      setLivePosition(null);
      return;
    }

    let active = true;
    const loadLiveData = async () => {
      try {
        const [deviceInfo, positions] = await Promise.all([
          devicesApi.get(traccarId),
          positionsApi.live(traccarId),
        ]);
        if (!active) return;

        setLiveDevice(deviceInfo);
        const latestPos = positions
          .slice()
          .sort(
            (a, b) =>
              new Date(b.fixTime).getTime() - new Date(a.fixTime).getTime(),
          )[0];
        setLivePosition(latestPos ?? null);
      } catch {
        if (!active) return;
        setLiveDevice(null);
        setLivePosition(null);
      }
    };

    void loadLiveData();
    return () => {
      active = false;
    };
  }, [animal?.deviceId]);

  useEffect(() => {
    if (!animal?.deviceId) {
      setRoutePoints([]);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    const traccarId = parseTraccarDeviceId(animal.deviceId);
    if (traccarId === undefined) {
      setRoutePoints([]);
      setRouteError("GPS төхөөрөмж холбогдоогүй байна.");
      setRouteLoading(false);
      return;
    }

    let active = true;
    setRouteLoading(true);
    setRouteError(null);

    const from = new Date();
    from.setDate(from.getDate() - 1);
    const to = new Date().toISOString();

    tripsApi
      .route(traccarId, from.toISOString(), to)
      .then((points) => {
        if (!active) return;
        setRoutePoints(points);
      })
      .catch((error) => {
        if (!active) return;
        setRoutePoints([]);
        setRouteError(error.message || "Маршрут ачаалж чадсангүй.");
      })
      .finally(() => {
        if (!active) return;
        setRouteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [animal?.deviceId]);

  if (!animal) {
    return (
      <>
        <ProfileTopbar id={id} />
        <p className="py-16 text-center font-mono text-sm text-mut">
          {mn.animal.notFound} ({id})
        </p>
      </>
    );
  }

  const badge = STATUS_BADGE[animal.status];
  const distCls =
    animal.status === "danger"
      ? "text-danger"
      : animal.status === "warning"
        ? "text-amber"
        : "text-ink";

  const latestRoutePoint = routePoints[routePoints.length - 1];
  const speedKmh = latestRoutePoint?.speedKmh ?? livePosition?.speed ?? animal.speedKmh;
  const lastSyncTime = latestRoutePoint?.ts ?? livePosition?.fixTime ?? animal.lastSeenAt;
  const batteryValue = liveDevice?.battery ?? device?.battery;
  const signalValue = liveDevice?.signal ?? device?.signal;
  const deviceOnline = liveDevice?.online ?? device?.online;

  return (
    <>
      <ProfileTopbar id={animal.id} />

      <div className="px-4 pb-nav pt-4 md:px-6 md:pt-5">
        {/* Hero */}
        <div className="mb-3.5 grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex size-[74px] items-center justify-center rounded-[18px] border border-line bg-bg-2 text-4xl">
            {SPECIES_EMOJI[animal.species]}
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-mut">
              ID · {animal.id}
              {device ? ` · ${device.type.toUpperCase()} ${device.firmwareVersion}` : ""}
            </div>
            <h1 className="my-1 truncate text-2xl font-bold leading-none">
              {animal.name ?? animal.id}
            </h1>
            <div className="font-mono text-[11px] uppercase text-ink-2">
              {mn.species[animal.species]} · {mn.animal.sex[animal.sex]} ·{" "}
              {animal.age} нас{animal.breed ? ` · ${animal.breed}` : ""}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 self-start rounded-[7px] px-3 py-1.5 font-mono text-xs font-bold tracking-wide",
              badge.cls,
            )}
          >
            ● {badge.label.toUpperCase()}
          </span>
        </div>

        {/* Metric grid */}
        <div className="mb-3.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <Metric
            label={mn.animal.pastureDist}
            value={`${(animal.distanceFromBaseM / 1000).toFixed(1)}км`}
            valueCls={distCls}
            sub={mn.proximity[animal.proximity]}
          />
          <Metric
            label={mn.device.battery}
            value={batteryValue != null ? `${batteryValue}%` : "—"}
            valueCls={batteryValue != null ? batteryColor(batteryValue) : "text-mut"}
            sub={
              batteryValue != null
                ? deviceOnline
                  ? mn.device.statusOnline
                  : mn.device.statusOffline
                : mn.animal.noDevice
            }
          />
          <Metric
            label={mn.animal.gpsSignal}
            value={signalValue != null ? signalLabel(signalValue).v : "—"}
            valueCls={signalValue != null ? signalLabel(signalValue).cls : "text-mut"}
            sub={signalValue != null ? `${signalValue}%` : ""}
          />
          <Metric
            label={mn.animal.lastSync}
            value={format(new Date(lastSyncTime), "HH:mm")}
            sub={format(new Date(lastSyncTime), "MM-dd")}
          />
        </div>

        {/* Route */}
        <Panel title={mn.animal.route}>
          <RoutePlayback animal={animal} />
        </Panel>

        {/* Events */}
        <EventLog animal={animal} />
      </div>
    </>
  );
}

function ProfileTopbar({ id }: { id: string }) {
  return (
    <Topbar
      title={
        <Link
          href="/herd"
          className="font-mono text-[13px] font-semibold text-mut transition-colors hover:text-ink"
        >
          ‹ {mn.nav.herd.toUpperCase()} / {id}
        </Link>
      }
      right={
        <Link
          href="/"
          aria-label={mn.nav.home}
          className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition-colors hover:bg-bg-2 [&_svg]:size-4"
        >
          <MapPin />
        </Link>
      }
    />
  );
}

function Metric({
  label,
  value,
  valueCls,
  sub,
}: {
  label: string;
  value: string;
  valueCls?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wide text-mut">
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-[22px] font-bold", valueCls)}>
        {value}
      </div>
      {sub && <div className="mt-0.5 font-mono text-[10px] text-mut">{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 rounded-xl border border-line bg-surface p-4">
      <h3 className="mb-3.5 text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}
