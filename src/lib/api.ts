/**
 * Малчин — Backend API client
 * Drop this file into src/lib/api.ts
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = new URL(path, BASE).toString();
  const res = await fetch(url, {
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: "online" | "offline" | "unknown";
  lastUpdate?: string;
  positionId?: number;
  category?: string;
  phone?: string;
  attributes?: Record<string, unknown>;
}

export interface Position {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;       // km/h
  course: number;
  fixTime: string;
  address?: string;
  attributes?: Record<string, unknown>;
}

export interface Geofence {
  id: number;
  name: string;
  description?: string;
  area: string;        // WKT POLYGON(...)
  attributes?: Record<string, unknown>;
}

export interface Trip {
  id: number;
  deviceId: number;
  startTime: string;
  endTime: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  startAddress?: string;
  endAddress?: string;
  distance: number;    // metres
  averageSpeed: number;
  maxSpeed: number;
  duration: number;    // seconds
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  time?: string;
  deviceTime?: string;
  serverTime?: string;
  speed?: number;
}

export interface Event {
  id: number;
  deviceId: number;
  type: string;
  eventTime: string;
  geofenceId?: number;
  attributes?: Record<string, unknown>;
}

// ── Devices ───────────────────────────────────────────────────────────────────

export const devicesApi = {
  list: () =>
    request<{ data: Device[] }>("/api/devices").then(r => r.data),

  get: (id: number) =>
    request<Device>(`/api/devices/${id}`),

  create: (body: Pick<Device, "name" | "uniqueId"> & Partial<Device>) =>
    request<Device>("/api/devices", { method: "POST", body: JSON.stringify(body) }),

  update: (id: number, body: Partial<Device>) =>
    request<Device>(`/api/devices/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  delete: (id: number) =>
    request<{ message: string }>(`/api/devices/${id}`, { method: "DELETE" }),
};

// ── Positions ─────────────────────────────────────────────────────────────────

export const positionsApi = {
  live: (deviceId?: number) => {
    const qs = deviceId ? `?deviceId=${deviceId}` : "";
    return request<{ data: Position[] }>(`/api/positions${qs}`).then(r => r.data);
  },

  latest: () =>
    // /api/positions/latest reads the DB cache, which returns snake_case columns
    // (device_id, fix_time, …). Normalize to the camelCase Position shape the app
    // uses everywhere, so live positions actually match their device.
    request<{ data: Array<Record<string, unknown>> }>("/api/positions/latest").then(r =>
      r.data.map((p): Position => ({
        id: Number(p.id ?? p.traccar_id ?? 0),
        deviceId: Number(p.deviceId ?? p.device_id),
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        altitude: Number(p.altitude ?? 0),
        speed: Number(p.speed ?? 0),
        course: Number(p.course ?? 0),
        fixTime: String(p.fixTime ?? p.fix_time ?? p.deviceTime ?? p.device_time ?? ""),
        address: (p.address as string) ?? undefined,
        attributes: (p.attributes as Record<string, unknown>) ?? undefined,
      })),
    ),
};

// ── Geofences ─────────────────────────────────────────────────────────────────

export const geofencesApi = {
  list: () =>
    request<{ data: Geofence[] }>("/api/geofences").then(r => r.data),

  create: (body: Pick<Geofence, "name" | "area"> & Partial<Geofence>) =>
    request<Geofence>("/api/geofences", { method: "POST", body: JSON.stringify(body) }),

  update: (id: number, body: Partial<Geofence>) =>
    request<Geofence>(`/api/geofences/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  delete: (id: number) =>
    request<{ message: string }>(`/api/geofences/${id}`, { method: "DELETE" }),

  events: (deviceId: number, from: string, to: string) =>
    request<{ data: Event[] }>(
      `/api/geofences/events?deviceId=${deviceId}&from=${from}&to=${to}`
    ).then(r => r.data),

  alerts: (deviceId?: number, limit = 100) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (deviceId) qs.set("deviceId", String(deviceId));
    return request<{ data: Event[] }>(`/api/geofences/alerts?${qs}`).then(r => r.data);
  },
};

// ── Trips ─────────────────────────────────────────────────────────────────────

export const tripsApi = {
  fetch: (deviceId: number, from: string, to: string) =>
    request<{ data: Trip[] }>(
      `/api/trips?deviceId=${deviceId}&from=${from}&to=${to}`
    ).then(r => r.data),

  history: (deviceId?: number, limit = 50) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (deviceId) qs.set("deviceId", String(deviceId));
    return request<{ data: Trip[] }>(`/api/trips/history?${qs}`).then(r => r.data);
  },

  route: (deviceId: number, from: string, to: string) =>
    request<{ data: RoutePoint[] } | RoutePoint[]>(
      `/api/trips/route?deviceId=${deviceId}&from=${from}&to=${to}`,
    ).then((r) => {
      // /api/trips/route returns a raw Traccar position array, while the other
      // endpoints wrap data in { data: [...] }. Handle both shapes.
      const points = Array.isArray(r) ? r : (r.data ?? []);
      return points.map((point) => ({
        lat: point.latitude,
        lng: point.longitude,
        ts:
          point.time ?? point.deviceTime ?? point.serverTime ?? undefined,
        speedKmh: point.speed ?? 0,
      }));
    }),
};
