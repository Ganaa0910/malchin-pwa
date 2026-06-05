"use client";

import { useMemo } from "react";
import { MapPin, Radio, Activity, Satellite, Compass, Signal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { InfoCard } from "@/components/ui/info-card";
import { mn } from "@/lib/i18n/mn";
import { useAnimals } from "@/lib/db/hooks";
import { AnimalStatusSheet } from "@/components/animal/AnimalStatusSheet";
import type { Animal } from "@/types/animal";
import type { Device, Position } from "@/lib/api";
import { timeAgoMn } from "@/lib/time";

function statusLabel(status?: string): string {
  if (status === "online") return "Холбогдсон";
  if (status === "offline") return "Холбоогүй";
  return "Хүлээгдэж буй";
}

function statusColor(status?: string): string {
  if (status === "online") return "text-success";
  if (status === "offline") return "text-destructive";
  return "text-warning";
}

function formatBearing(bearing?: number): string {
  if (bearing === undefined || bearing === null) return "—";
  const directions = ["Ү", "ЗУ", "З", "БУ", "Б", "БЗ", "БЗ", "ЗУ"];
  const idx = Math.round(bearing / 45) % 8;
  return `${directions[idx]} ${bearing.toFixed(0)}°`;
}

export function DeviceSheet({
  device,
  position,
  open,
  onOpenChange,
}: {
  device: Device | null;
  position: Position | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const animals = useAnimals();

  const linkedAnimal: Animal | undefined = useMemo(() => {
    if (!device) return undefined;
    return animals.find((animal) => {
      if (animal.tag && device.uniqueId && animal.tag === device.uniqueId) {
        return true;
      }
      if (typeof device.id === "number") {
        return animal.deviceId === `D-T-${device.id}`;
      }
      return animal.deviceId === device.id;
    });
  }, [animals, device]);

  if (!device) return null;

  if (linkedAnimal) {
    return (
      <AnimalStatusSheet
        animal={linkedAnimal}
        open={open}
        onOpenChange={onOpenChange}
      />
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-safe max-w-[420px] mx-auto">
        <SheetHeader className="px-5 pt-2">
          <SheetDescription className="sr-only">
            Төхөөрөмжийн дэлгэрэнгүй
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pt-2 pb-2 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                GPS Төхөөрөмж
              </p>
              <h2 className="text-2xl font-bold leading-tight truncate">
                {device.name}
              </h2>
            </div>
            <div className={`${statusColor(device.status)} text-2xl`}>
              <Signal className="h-6 w-6" />
            </div>
          </div>

          <InfoCard
            rows={[
              {
                icon: Radio,
                label: "Статус",
                value: statusLabel(device.status),
                valueCls: statusColor(device.status),
              },
              ...(device.uniqueId
                ? [
                    {
                      icon: Signal,
                      label: "ID",
                      value: device.uniqueId,
                      valueCls: "font-mono text-xs",
                    } as const,
                  ]
                : []),
              ...(position
                ? [
                    {
                      icon: MapPin,
                      label: "Өргөрг",
                      value: `${position.latitude.toFixed(6)}°`,
                      valueCls: "font-mono",
                    },
                    {
                      icon: MapPin,
                      label: "Уртраг",
                      value: `${position.longitude.toFixed(6)}°`,
                      valueCls: "font-mono",
                    },
                    {
                      icon: Activity,
                      label: "Хурд",
                      value: `${position.speed.toFixed(1)} км/ц`,
                      valueCls: "font-mono",
                    },
                    {
                      icon: Compass,
                      label: "Чиглэл",
                      value: formatBearing(position.course),
                      valueCls: "font-mono",
                    },
                    ...(position.altitude !== undefined
                      ? [
                          {
                            icon: Satellite,
                            label: "Өндөр",
                            value: `${position.altitude.toFixed(0)} м`,
                            valueCls: "font-mono",
                          } as const,
                        ]
                      : []),
                    {
                      icon: Radio,
                      label: "Сүүлийн шинэчилэл",
                      value: timeAgoMn(new Date(position.fixTime)),
                    } as const,
                  ]
                : []),
            ]}
          />

          {position?.address && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Хаяг</p>
              <p className="text-sm leading-snug">{position.address}</p>
            </div>
          )}

          {linkedAnimal && (
            <Button asChild className="tap w-full mt-2">
              <Link href={`/herd/${(linkedAnimal as Animal).id}`}>
                Малын профайл
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
