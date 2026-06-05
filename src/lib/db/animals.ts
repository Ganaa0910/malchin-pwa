import { getDb } from "./dexie";
import type { Animal } from "@/types/animal";
import type { Device as TraccarDevice } from "@/lib/api";

function localDeviceId(traccarDeviceId: number) {
  return `D-T-${traccarDeviceId}`;
}

function animalIdForDevice(traccarDeviceId: number) {
  return `A-T-${traccarDeviceId}`;
}

function statusFromTraccar(status: TraccarDevice["status"]) {
  if (status === "online") return "safe" as const;
  if (status === "offline") return "offline" as const;
  return "warning" as const;
}

function proximityFromTraccar(status: TraccarDevice["status"]) {
  return status === "online" ? "SAFE" as const : "WARNING" as const;
}

export async function createAnimalProfileFromTraccarDevice(
  device: TraccarDevice,
  ownerId: string,
  herdId: string,
  baseLat: number,
  baseLng: number,
) {
  const db = getDb();
  const animalId = animalIdForDevice(device.id);
  const deviceId = localDeviceId(device.id);
  const now = new Date().toISOString();
  const animal: Animal = {
    id: animalId,
    tag: device.uniqueId,
    name: device.name || null,
    species: "үхэр",
    breed: "",
    age: 1,
    sex: "female",
    weightKg: 0,
    color: "",
    ownerId,
    herdId,
    deviceId,
    lat: baseLat,
    lng: baseLng,
    altitudeM: undefined,
    lastSeenAt: now,
    status: statusFromTraccar(device.status),
    proximity: proximityFromTraccar(device.status),
    speedKmh: 0,
    distanceFromBaseM: 0,
    healthFlags: [],
  };

  const localDevice = {
    id: deviceId,
    serial: device.uniqueId,
    type: "collar" as const,
    animalId,
    battery: 0,
    signal: 0,
    firmwareVersion: "traccar",
    lastPingAt: now,
    online: device.status === "online",
  };

  await db.transaction("rw", db.animals, db.devices, async () => {
    await db.animals.add(animal);
    await db.devices.add(localDevice);
  });
}

export async function deleteAnimalProfile(animal: Animal) {
  const db = getDb();
  await db.transaction("rw", db.animals, db.devices, async () => {
    await db.animals.delete(animal.id);
    if (animal.deviceId?.startsWith("D-T-")) {
      const localDevice = await db.devices.get(animal.deviceId);
      if (localDevice?.animalId === animal.id) {
        await db.devices.delete(animal.deviceId);
      }
    }
  });
}
