"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimals, useZones, usePolygons } from "@/lib/db/hooks";
import { useNotifications } from "@/lib/store/useNotifications";
import { buildFences, dangerFences, type EvalFence } from "@/lib/fences";
import { distanceToPolygonM, pointInPolygon } from "@/lib/proximity";
import { geofencesApi, devicesApi, positionsApi, type Geofence } from "@/lib/api";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";
import type { Animal } from "@/types/animal";

let alertSeq = 0;

/** Persist a proximity event into the Dexie alerts table so it shows in Мэдэгдэл. */
function persistAlert(
  animal: Animal,
  fence: EvalFence,
  deter: boolean,
  title: string,
  message: string,
) {
  getDb()
    .alerts.add({
      id: `prx-${Date.now()}-${alertSeq++}`,
      type: "breach",
      priority: deter ? "high" : "medium",
      title,
      message,
      animalId: animal.id ?? null,
      deviceId: animal.deviceId ?? null,
      zoneId: fence.id ?? null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      acknowledged: false,
      lat: animal.lat,
      lng: animal.lng,
    })
    .catch(() => {});
}

/** Warning band: an animal within this distance of a danger-zone edge is "near". */
const NEAR_M = 500;
/** Within this distance of the edge (or inside) counts as reaching the boundary. */
const BOUNDARY_M = 40;
const POLL_MS = 8000;

type Phase = "clear" | "near" | "deter";
interface AnimalState {
  phase: Phase;
  prevDist: number;
  gotClose: boolean;
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(1)} км`;
}
function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/**
 * Headless watcher. Compares every animal (with live Traccar positions overlaid
 * when available) against the active danger fences and raises notifications:
 *   1. "approaching" when an animal comes within NEAR_M of a danger zone, and
 *   2. "buzzer fired / turned around" when an animal that reached the boundary
 *      then moves back away from it.
 * Renders nothing — it only drives the notification store.
 */
export function ProximityMonitor() {
  const animals = useAnimals();
  const zones = useZones();
  const polygons = usePolygons();
  const push = useNotifications((s) => s.push);

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  // uniqueId -> live {lat,lng,speed}, refreshed by polling Traccar.
  const [livePos, setLivePos] = useState<Record<string, { lat: number; lng: number }>>({});

  const stateRef = useRef<Map<string, AnimalState>>(new Map());
  const seededRef = useRef(false);

  // Danger Traccar geofences once on mount.
  useEffect(() => {
    let active = true;
    geofencesApi.list().then((g) => active && setGeofences(g)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Poll live positions and map device id -> uniqueId so we can match animals.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function tick() {
      try {
        const [devices, positions] = await Promise.all([
          devicesApi.list(),
          positionsApi.latest(),
        ]);
        if (!active) return;
        const idToUnique = new Map(devices.map((d) => [d.id, d.uniqueId]));
        const next: Record<string, { lat: number; lng: number }> = {};
        for (const p of positions) {
          const uid = idToUnique.get(p.deviceId);
          if (uid) next[uid] = { lat: p.latitude, lng: p.longitude };
        }
        setLivePos(next);
      } catch {
        /* keep last known positions on failure */
      }
    }

    tick();
    timer = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  // Overlay live coordinates onto the matching app animals.
  const liveAnimals = useMemo<Animal[]>(
    () =>
      animals.map((a) => {
        const live = a.deviceId ? livePos[a.deviceId] : undefined;
        return live ? { ...a, lat: live.lat, lng: live.lng } : a;
      }),
    [animals, livePos],
  );

  const danger = useMemo(
    () => dangerFences(buildFences(zones, polygons, geofences)),
    [zones, polygons, geofences],
  );

  useEffect(() => {
    if (danger.length === 0) return;
    const states = stateRef.current;
    const firstRun = !seededRef.current;

    for (const a of liveAnimals) {
      // Nearest danger fence for this animal.
      let nearest = danger[0];
      let bestDist = Infinity;
      let inside = false;
      for (const f of danger) {
        const d = distanceToPolygonM(a.lat, a.lng, f.coordinates);
        if (d < bestDist) {
          bestDist = d;
          nearest = f;
          inside = d === 0 ? true : pointInPolygon(a.lat, a.lng, f.coordinates);
        }
      }

      const atBoundary = inside || bestDist <= BOUNDARY_M;
      const phase: Phase = atBoundary ? "deter" : bestDist <= NEAR_M ? "near" : "clear";

      const prev = states.get(a.id);
      const name = a.name ?? a.id;

      if (!prev || firstRun) {
        states.set(a.id, { phase, prevDist: bestDist, gotClose: atBoundary });
        continue; // seed only — never notify on first evaluation
      }

      const movingAway = bestDist > prev.prevDist + 3;
      const next: AnimalState = {
        phase,
        prevDist: bestDist,
        gotClose: prev.gotClose || atBoundary,
      };

      // 1) Just started getting near a danger zone.
      if (phase !== "clear" && prev.phase === "clear") {
        const deter = phase === "deter";
        const title = deter ? mn.notify.breachTitle : mn.notify.nearTitle;
        const body = fill(deter ? mn.notify.breachBody : mn.notify.nearBody, {
          animal: name,
          zone: nearest.name,
          dist: fmtDist(bestDist),
        });
        push({ id: `near-${a.id}`, kind: deter ? "deter" : "warn", title, body });
        persistAlert(a, nearest, deter, title, body);
      }

      // 2) Reached the boundary (buzzer) and is now retreating → turned around.
      if (prev.gotClose && movingAway && phase !== "deter") {
        const title = mn.notify.deterTitle;
        const body = fill(mn.notify.deterBody, { animal: name, zone: nearest.name });
        push({ id: `deter-${a.id}`, kind: "deter", title, body });
        persistAlert(a, nearest, true, title, body);
        next.gotClose = false;
      }

      states.set(a.id, next);
    }

    seededRef.current = true;
  }, [liveAnimals, danger, push]);

  return null;
}
