"use client";

import { getDb } from "./dexie";
import ownerJson from "@/data/owner.json";
import herdsJson from "@/data/herds.json";
import zonesJson from "@/data/zones.json";
import animalsJson from "@/data/animals.json";
import devicesJson from "@/data/devices.json";
import alertsJson from "@/data/alerts.json";
import weatherJson from "@/data/weather.json";

import type { Owner, Herd } from "@/types/owner";
import type { Zone } from "@/types/zone";
import type { Animal } from "@/types/animal";
import type { Device } from "@/types/device";
import type { Alert } from "@/types/alert";
import type { Weather } from "@/types/weather";

const SEED_VERSION = "1.3.0";
const SEED_KEY = "malchin.seedVersion";

/**
 * One-shot seeder. Loads JSON fixtures into IndexedDB on first run.
 * Idempotent — uses a localStorage marker so re-renders don't re-seed.
 * Bump SEED_VERSION when fixture shapes change.
 */
export async function seedDb(): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  const db = getDb();
  const marker = window.localStorage.getItem(SEED_KEY);

  if (marker === SEED_VERSION) {
    const counts = await currentCounts();
    if (counts.animals > 0) {
      return { seeded: false, counts };
    }
    // marker present but DB empty → user cleared IDB; reseed.
  }

  await db.transaction(
    "rw",
    [db.owner, db.herds, db.zones, db.animals, db.devices, db.alerts, db.weather],
    async () => {
      await db.owner.clear();
      await db.herds.clear();
      await db.zones.clear();
      await db.animals.clear();
      await db.devices.clear();
      await db.alerts.clear();
      await db.weather.clear();

      await db.owner.put(ownerJson as Owner);
      await db.herds.bulkPut(herdsJson as Herd[]);
      await db.zones.bulkPut(zonesJson as Zone[]);
      await db.animals.bulkPut(animalsJson as Animal[]);
      await db.devices.bulkPut(devicesJson as Device[]);
      await db.alerts.bulkPut(alertsJson as Alert[]);
      await db.weather.put({ ...(weatherJson as Weather), id: "current" });
    },
  );

  window.localStorage.setItem(SEED_KEY, SEED_VERSION);
  return { seeded: true, counts: await currentCounts() };
}

async function currentCounts() {
  const db = getDb();
  const [animals, devices, alerts, zones, herds] = await Promise.all([
    db.animals.count(),
    db.devices.count(),
    db.alerts.count(),
    db.zones.count(),
    db.herds.count(),
  ]);
  return { animals, devices, alerts, zones, herds };
}
