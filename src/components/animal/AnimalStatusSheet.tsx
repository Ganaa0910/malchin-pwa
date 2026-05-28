"use client";

import Link from "next/link";
import { Battery, MapPin, Radio, Activity, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProximityBadge } from "@/components/animal/ProximityBadge";
import { mn } from "@/lib/i18n/mn";
import type { Animal } from "@/types/animal";
import { useDevice } from "@/lib/db/hooks";
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

  if (!animal) return null;

  const speciesLabel = mn.species[animal.species];
  const title = animal.name ? `${animal.name} · ${animal.id}` : animal.id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-xl pb-safe max-w-[420px] mx-auto"
        style={{ borderRadius: "var(--radius) var(--radius) 0 0" }}
      >
        <SheetHeader className="px-5 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {speciesLabel}
                {animal.breed ? ` · ${animal.breed}` : ""}
              </p>
              <SheetTitle className="font-display text-2xl leading-tight truncate">
                {title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Малын дэлгэрэнгүй
              </SheetDescription>
            </div>
            <ProximityBadge value={animal.proximity} />
          </div>
        </SheetHeader>

        <div className="px-5 pt-2 pb-2 space-y-3">
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {mn.animal.distanceFromBase}
            </div>
            <div className="text-right font-mono">
              {(animal.distanceFromBaseM / 1000).toFixed(2)} км
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="size-3.5" aria-hidden />
              {mn.animal.speed}
            </div>
            <div className="text-right font-mono">
              {animal.speedKmh.toFixed(1)} {mn.weather.windUnit}
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Radio className="size-3.5" aria-hidden />
              {mn.animal.lastSeen}
            </div>
            <div className="text-right">{timeAgoMn(animal.lastSeenAt)}</div>

            {device ? (
              <>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Battery className="size-3.5" aria-hidden />
                  {mn.device.battery}
                </div>
                <div
                  className={`text-right font-mono ${batteryColor(device.battery)}`}
                >
                  {device.battery}%
                </div>
              </>
            ) : (
              <>
                <div className="text-muted-foreground">{mn.animal.device}</div>
                <div className="text-right text-muted-foreground">
                  {mn.animal.noDevice}
                </div>
              </>
            )}
          </dl>

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
