"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "./dexie";
import animalsJson from "@/data/animals.json";
import zonesJson from "@/data/zones.json";
import alertsJson from "@/data/alerts.json";
import ownerJson from "@/data/owner.json";
import devicesJson from "@/data/devices.json";
import weatherJson from "@/data/weather.json";
import type { Animal } from "@/types/animal";
import type { Alert } from "@/types/alert";
import type { Zone } from "@/types/zone";
import type { Device } from "@/types/device";
import type { Owner } from "@/types/owner";
import type { Weather } from "@/types/weather";
import type { CustomPolygon } from "@/types/polygon";

/* Seed JSON serves as the SSR-friendly default — useLiveQuery
   swaps to live Dexie data once the seeder has finished. */
const INITIAL_ANIMALS = animalsJson as Animal[];
const INITIAL_ZONES = zonesJson as Zone[];
const INITIAL_ALERTS = (alertsJson as Alert[])
  .slice()
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
const INITIAL_DEVICES = devicesJson as Device[];
const INITIAL_OWNER = ownerJson as Owner;
const INITIAL_WEATHER = weatherJson as Weather;

export function useAnimals(): Animal[] {
  return (
    useLiveQuery(() => getDb().animals.toArray(), [], INITIAL_ANIMALS) ??
    INITIAL_ANIMALS
  );
}

export function useAnimal(id: string | undefined): Animal | undefined {
  return useLiveQuery(
    () => (id ? getDb().animals.get(id) : undefined),
    [id],
    id ? INITIAL_ANIMALS.find((a) => a.id === id) : undefined,
  );
}

export function useZones(): Zone[] {
  return (
    useLiveQuery(() => getDb().zones.toArray(), [], INITIAL_ZONES) ??
    INITIAL_ZONES
  );
}

export function useAlerts(): Alert[] {
  return (
    useLiveQuery(
      () =>
        getDb()
          .alerts.orderBy("createdAt")
          .reverse()
          .toArray(),
      [],
      INITIAL_ALERTS,
    ) ?? INITIAL_ALERTS
  );
}

export function useDevice(id: string | null | undefined): Device | undefined {
  return useLiveQuery(
    () => (id ? getDb().devices.get(id) : undefined),
    [id],
    id ? INITIAL_DEVICES.find((d) => d.id === id) : undefined,
  );
}

export function usePolygons(): CustomPolygon[] {
  return (
    useLiveQuery(
      () => getDb().polygons.orderBy("createdAt").toArray(),
      [],
      [] as CustomPolygon[],
    ) ?? []
  );
}

export function useOwner(): Owner | undefined {
  return useLiveQuery(
    () => getDb().owner.toCollection().first(),
    [],
    INITIAL_OWNER,
  );
}

export function useWeather(): Weather | undefined {
  return useLiveQuery(
    async () => {
      const row = await getDb().weather.get("current");
      if (!row) return INITIAL_WEATHER;
      const { id: _id, ...rest } = row;
      void _id;
      return rest as Weather;
    },
    [],
    INITIAL_WEATHER,
  );
}
