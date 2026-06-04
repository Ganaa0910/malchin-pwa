"use client";

import { getDb } from "./dexie";
import type { CustomPolygon } from "@/types/polygon";

export async function addPolygon(
  coordinates: [number, number][],
  name: string,
  color = "#0F6E56",
): Promise<CustomPolygon> {
  const poly: CustomPolygon = {
    id: `poly-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    coordinates,
    color,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await getDb().polygons.add(poly);
  return poly;
}

export async function deletePolygon(id: string): Promise<void> {
  await getDb().polygons.delete(id);
}

export async function renamePolygon(id: string, name: string): Promise<void> {
  await getDb().polygons.update(id, { name });
}

/**
 * Enable/disable a fence. Persisted in IndexedDB for now;
 * swap the body for an API call when the backend lands.
 */
export async function setPolygonActive(
  id: string,
  active: boolean,
): Promise<void> {
  await getDb().polygons.update(id, { active });
}
