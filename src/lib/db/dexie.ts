import Dexie, { type Table } from "dexie";
import type { Animal } from "@/types/animal";
import type { Device } from "@/types/device";
import type { Alert } from "@/types/alert";
import type { Zone } from "@/types/zone";
import type { Weather } from "@/types/weather";
import type { Owner, Herd } from "@/types/owner";
import type { CustomPolygon } from "@/types/polygon";

export interface EventLog {
  id?: number;
  animalId: string;
  type:
    | "breach"
    | "buffer"
    | "speed-spike"
    | "low-battery"
    | "back-in-zone"
    | "device-offline"
    | "device-online";
  timestamp: string;
  lat?: number;
  lng?: number;
  meta?: Record<string, unknown>;
}

export interface SyncOp {
  id?: number;
  kind:
    | "ack-alert"
    | "create-zone"
    | "update-zone"
    | "delete-zone"
    | "ack-breach"
    | "update-animal";
  payload: unknown;
  createdAt: string;
  attempts: number;
}

interface WeatherRow extends Weather {
  id: string;
}

export class MalchinDB extends Dexie {
  owner!: Table<Owner, string>;
  herds!: Table<Herd, string>;
  zones!: Table<Zone, string>;
  animals!: Table<Animal, string>;
  devices!: Table<Device, string>;
  alerts!: Table<Alert, string>;
  weather!: Table<WeatherRow, string>;
  events!: Table<EventLog, number>;
  syncQueue!: Table<SyncOp, number>;
  polygons!: Table<CustomPolygon, string>;

  constructor() {
    super("malchin");
    this.version(1).stores({
      owner: "id",
      herds: "id, ownerId, species",
      zones: "id, type, active",
      animals:
        "id, herdId, species, status, proximity, deviceId, distanceFromBaseM",
      devices: "id, animalId, type, battery, online",
      alerts: "id, priority, type, acknowledged, createdAt, animalId",
      weather: "id",
      events: "++id, animalId, type, timestamp",
      syncQueue: "++id, kind, createdAt",
    });
    // v2 — user-drawn custom polygons (not seeded; survives reseeds).
    this.version(2).stores({
      polygons: "id, createdAt",
    });
  }
}

let _db: MalchinDB | null = null;
export function getDb(): MalchinDB {
  if (typeof window === "undefined") {
    throw new Error("MalchinDB is browser-only — guard with a client check");
  }
  if (!_db) _db = new MalchinDB();
  return _db;
}
