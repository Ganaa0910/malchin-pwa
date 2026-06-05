"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Battery, MapPin, Radio, Activity, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/ui/info-card";
import { ProximityBadge } from "@/components/animal/ProximityBadge";
import { mn } from "@/lib/i18n/mn";
import type { Animal } from "@/types/animal";
import { useDevice } from "@/lib/db/hooks";
import { parseTraccarDeviceId } from "@/lib/utils";
import { devicesApi, positionsApi, type Position } from "@/lib/api";
import { timeAgoMn } from "@/lib/time";

function batteryColor(b: number): string {
  if (b < 15) return "text-destructive";
  if (b < 30) return "text-warning";
  return "text-success";
}

export function AnimalStatusSheet({
  animal,
  open,
  onOpenChange,
}: {
  animal: Animal | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const device = useDevice(animal?.deviceId);
  const [liveDevice, setLiveDevice] = useState<any>(null);
  const [livePosition, setLivePosition] = useState<Position | null>(null);

  useEffect(() => {
    const traccarId = parseTraccarDeviceId(animal?.deviceId);
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

  if (!animal) return null;

  const speciesLabel = mn.species[animal.species];
  const title = animal.name ? `${animal.name} · ${animal.id}` : animal.id;
  const speedKmh = livePosition?.speed ?? animal.speedKmh;
  const lastSeenAt = livePosition?.fixTime ?? animal.lastSeenAt;
  const batteryValue = liveDevice?.battery ?? device?.battery;
  const deviceOnline = liveDevice?.online ?? device?.online;
  const hasGps = Boolean(liveDevice || device);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="pb-safe max-w-[420px] mx-auto"
      >
        <SheetHeader className="px-5 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {speciesLabel}
                {animal.breed ? ` · ${animal.breed}` : ""}
              </p>
              <SheetTitle className="text-2xl leading-tight truncate">
                {title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Малын дэлгэрэнгүй
              </SheetDescription>
            </div>
            <ProximityBadge value={animal.proximity} />
          </div>
        </SheetHeader>

        <div className="px-5 pt-4 pb-2 space-y-3">
          <InfoCard
            rows={[
              {
                icon: MapPin,
                label: mn.animal.distanceFromBase,
                value: `${(animal.distanceFromBaseM / 1000).toFixed(2)} км`,
                valueCls: "font-mono",
              },
              {
                icon: Activity,
                label: mn.animal.speed,
                value: `${speedKmh.toFixed(1)} ${mn.weather.windUnit}`,
                valueCls: "font-mono",
              },
              {
                icon: Radio,
                label: mn.animal.lastSeen,
                value: timeAgoMn(lastSeenAt),
              },
              ...(hasGps
                ? [
                    {
                      icon: Battery,
                      label: mn.device.battery,
                      value: batteryValue != null ? `${batteryValue}%` : mn.animal.noDevice,
                      valueCls: batteryColor(batteryValue ?? 0),
                    } as const,
                  ]
                : []),
            ]}
          />

          {animal.healthFlags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {animal.healthFlags.map((f) => (
                <span
                  key={f}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {mn.health[f]}
                </span>
              ))}
            </div>
          )}

          <Button asChild className="tap w-full mt-2">
            <Link href={`/herd/${animal.id}`}>
              Дэлгэрэнгүй
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
