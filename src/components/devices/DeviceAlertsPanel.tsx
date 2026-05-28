"use client";

import { Battery, BatteryWarning, Radio, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { cn } from "@/lib/utils";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";
import type { Device } from "@/types/device";

export function DeviceAlertsPanel() {
  const data = useLiveQuery(async () => {
    const db = getDb();
    const [lowBattery, baseStations] = await Promise.all([
      db.devices.where("battery").below(15).toArray(),
      db.devices.where("type").equals("base-station").toArray(),
    ]);
    return { lowBattery, baseStations };
  }, []);

  if (!data) return null;
  const { lowBattery, baseStations } = data;
  const lowBatteryCollars = lowBattery.filter((d) => d.type === "collar");

  return (
    <section aria-labelledby="device-alerts" className="space-y-2">
      <h2
        id="device-alerts"
        className="font-display text-lg px-1 flex items-center gap-2"
      >
        <Radio className="size-5" aria-hidden />
        {mn.device.title}
      </h2>

      <ul className="space-y-2">
        {baseStations.map((b) => (
          <BaseStationItem key={b.id} device={b} />
        ))}
        {lowBatteryCollars.length > 0 && (
          <li
            className="rounded-md border-card bg-card text-card-foreground p-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="size-10 shrink-0 rounded-full flex items-center justify-center bg-destructive/15 text-destructive"
              >
                <BatteryWarning className="size-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">
                  {lowBatteryCollars.length} төхөөрөмжийн батарей бага
                </p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  15%-аас доош цэнэгтэй
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1">
              {lowBatteryCollars.slice(0, 5).map((d) => (
                <LowBatteryRow key={d.id} device={d} />
              ))}
            </ul>
          </li>
        )}
      </ul>
    </section>
  );
}

function BaseStationItem({ device }: { device: Device }) {
  const Online = device.online ? Wifi : WifiOff;
  return (
    <li
      className="rounded-md border-card bg-card text-card-foreground p-3"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "size-10 shrink-0 rounded-full flex items-center justify-center",
            device.online
              ? "bg-success/15 text-success"
              : "bg-destructive/15 text-destructive",
          )}
        >
          <Online className="size-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            {mn.device.baseStation} · {device.id}
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            {device.online ? mn.device.statusOnline : mn.device.statusOffline}
            {" · "}
            <span className="font-mono">{mn.device.firmware} {device.firmwareVersion}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{mn.device.signal}</p>
          <p className="font-mono text-sm">{device.signal}%</p>
        </div>
      </div>
    </li>
  );
}

function LowBatteryRow({ device }: { device: Device }) {
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <Link
        href={device.animalId ? `/herd/${device.animalId}` : "#"}
        className="flex items-center gap-2 truncate text-foreground hover:underline"
      >
        <Battery className="size-3 text-destructive shrink-0" aria-hidden />
        <span className="font-mono">{device.id}</span>
        {device.animalId && (
          <>
            <span className="text-muted-foreground" aria-hidden>
              →
            </span>
            <span className="font-mono text-muted-foreground">
              {device.animalId}
            </span>
          </>
        )}
      </Link>
      <span className="font-mono text-destructive shrink-0">{device.battery}%</span>
    </li>
  );
}
