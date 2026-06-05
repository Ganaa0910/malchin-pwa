"use client";

import { useEffect } from "react";
import { seedDb } from "@/lib/db";
import { devicesApi } from "@/lib/api";
import { getDb } from "@/lib/db/dexie";

/**
 * Auto-import devices from Traccar on startup.
 * Creates device records AND animal records in local database.
 */
async function autoImportTraccarDevices() {
  try {
    // Fetch devices from Traccar
    const traccarDevices = await devicesApi.list();
    if (!traccarDevices || traccarDevices.length === 0) {
      return;
    }

    const db = getDb();
    const existingDevices = await db.devices.toArray();
    const existingIds = new Set(existingDevices.map((d) => d.id));

    // Filter devices not already in local database
    const devicesToImport = traccarDevices.filter(
      (device) => !existingIds.has(`D-T-${device.id}`)
    );

    if (devicesToImport.length === 0) {
      return;
    }

    // Get owner and herd for context
    const owner = await db.owner.toCollection().first();
    const herds = await db.herds.toArray();
    
    if (!owner || herds.length === 0) {
      console.warn("[malchin] No owner or herds found, skipping animal creation");
      return;
    }

    const herd = herds[0];
    const now = new Date().toISOString();

    // Import devices and create corresponding animals
    await Promise.all(
      devicesToImport.map(async (device) => {
        const deviceId = `D-T-${device.id}`;
        
        // Store device
        await db.devices.put({
          id: deviceId,
          serial: device.uniqueId || "",
          type: "collar",
          animalId: null,
          battery: 0,
          signal: 0,
          firmwareVersion: "Traccar",
          lastPingAt: device.lastUpdate ? new Date(device.lastUpdate).toISOString() : new Date().toISOString(),
          online: device.status === "online",
        });

        // Create animal record linked to this device
        const animalId = `A-${device.uniqueId || device.id}`;
        await db.animals.put({
          id: animalId,
          tag: device.uniqueId || `COW${device.id}`,
          name: device.name || null,
          species: "үхэр",
          breed: "Traccar",
          age: 0,
          sex: "male",
          ownerId: owner.id,
          herdId: herd.id,
          deviceId: deviceId,
          lat: owner.baseLat,
          lng: owner.baseLng,
          lastSeenAt: now,
          status: "safe",
          proximity: "SAFE",
          speedKmh: 0,
          distanceFromBaseM: 0,
          healthFlags: [],
        });
      })
    );

    console.log(
      `[malchin] Auto-imported ${devicesToImport.length} device(s) from Traccar and created animal records`
    );
  } catch (err) {
    console.error("[malchin] autoImportTraccarDevices failed", err);
  }
}

/**
 * Mounts once at the herder layout. Idempotent.
 * Side-effect only — renders nothing.
 */
export function DbBootstrap() {
  useEffect(() => {
    void (async () => {
      await seedDb().catch((err) => {
        console.error("[malchin] seedDb failed", err);
      });
      await autoImportTraccarDevices();
    })();
  }, []);
  return null;
}
