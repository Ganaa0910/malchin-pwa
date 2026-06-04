"use client";

import { getDb } from "./dexie";

/**
 * Enable/disable an imported zone (pasture/camp/etc). Persisted in IndexedDB
 * for now; swap the body for an API call when the backend lands.
 */
export async function setZoneActive(
  id: string,
  active: boolean,
): Promise<void> {
  await getDb().zones.update(id, { active });
}

export async function deleteZone(id: string): Promise<void> {
  await getDb().zones.delete(id);
}
