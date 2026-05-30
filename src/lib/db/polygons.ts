"use client";

import { getDb } from "./dexie";
import type { CustomPolygon } from "@/types/polygon";

export async function addPolygon(
  coordinates: [number, number][],
  name: string,
  color = "#16a34a",
): Promise<CustomPolygon> {
  const poly: CustomPolygon = {
    id: `poly-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    coordinates,
    color,
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
