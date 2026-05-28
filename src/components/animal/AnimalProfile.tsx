"use client";

import Link from "next/link";
import { ArrowLeft, Battery, MapPin, Activity, Radio } from "lucide-react";
import { useAnimal, useDevice } from "@/lib/db/hooks";
import { ProximityBadge } from "@/components/animal/ProximityBadge";
import { RoutePlayback } from "@/components/animal/RoutePlayback";
import { EventLog } from "@/components/animal/EventLog";
import { mn } from "@/lib/i18n/mn";
import { format } from "date-fns";

function batteryColor(b: number): string {
  if (b < 15) return "text-destructive";
  if (b < 30) return "text-warning";
  return "text-success";
}

export function AnimalProfile({ id }: { id: string }) {
  const animal = useAnimal(id);
  const device = useDevice(animal?.deviceId);

  if (!animal) {
    return (
      <main className="px-5 pt-safe pb-10">
        <div className="py-12 text-center text-sm text-muted-foreground">
          Мал олдсонгүй ({id})
        </div>
      </main>
    );
  }

  const title = animal.name ? `${animal.name}` : animal.id;

  return (
    <main className="pb-nav space-y-5">
      <header className="pt-safe px-5 pt-3 pb-2 space-y-3">
        <Link
          href="/herd"
          className="tap inline-flex items-center gap-2 text-sm text-muted-foreground"
          aria-label="Сүрэг рүү буцах"
        >
          <ArrowLeft className="size-4" /> Сүрэг
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {mn.species[animal.species]}
              {animal.breed ? ` · ${animal.breed}` : ""}
            </p>
            <h1 className="text-3xl leading-tight">{title}</h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              {animal.id} · {animal.tag}
            </p>
          </div>
          <ProximityBadge value={animal.proximity} />
        </div>
      </header>

      <section className="px-5">
        <dl
          className="grid grid-cols-2 gap-3"
          style={{ gridAutoRows: "1fr" }}
        >
          <StatCard
            Icon={MapPin}
            label={mn.animal.distanceFromBase}
            value={`${(animal.distanceFromBaseM / 1000).toFixed(2)} км`}
          />
          <StatCard
            Icon={Activity}
            label={mn.animal.speed}
            value={`${animal.speedKmh.toFixed(1)} ${mn.weather.windUnit}`}
          />
          <StatCard
            Icon={Radio}
            label={mn.animal.lastSeen}
            value={format(new Date(animal.lastSeenAt), "HH:mm")}
            sub={format(new Date(animal.lastSeenAt), "yyyy-MM-dd")}
          />
          <StatCard
            Icon={Battery}
            label={mn.device.battery}
            value={device ? `${device.battery}%` : mn.animal.noDevice}
            valueClass={device ? batteryColor(device.battery) : undefined}
          />
        </dl>
      </section>

      {animal.healthFlags.length > 0 && (
        <section className="px-5 space-y-2">
          <h2 className="text-lg">{mn.animal.healthFlags}</h2>
          <div className="flex flex-wrap gap-2">
            {animal.healthFlags.map((f) => (
              <span
                key={f}
                className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {mn.health[f]}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="px-5">
        <RoutePlayback animal={animal} />
      </div>

      <div className="px-5">
        <EventLog animal={animal} />
      </div>
    </main>
  );
}

function StatCard({
  Icon,
  label,
  value,
  sub,
  valueClass,
}: {
  Icon: typeof MapPin;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div
      className="rounded-md border bg-card text-card-foreground p-3"
      
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div
        className={`text-xl mt-1 ${valueClass ?? ""}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
