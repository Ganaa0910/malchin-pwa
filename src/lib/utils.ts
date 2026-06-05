import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseTraccarDeviceId(deviceId?: string | null): number | undefined {
  if (!deviceId) return undefined;
  if (deviceId.startsWith("D-T-")) {
    const parsed = Number(deviceId.slice(4));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (deviceId.startsWith("D-")) {
    const parsed = Number(deviceId.slice(2));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  // Handle COW format (e.g., "COW001" -> 1, "COW002" -> 2)
  if (deviceId.startsWith("COW")) {
    const parsed = Number(deviceId.slice(3));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
