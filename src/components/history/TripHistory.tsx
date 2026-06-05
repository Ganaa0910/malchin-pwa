"use client";

/**
 * TripHistory — View past GPS routes per device
 * Drop into: src/components/history/TripHistory.tsx
 *
 * Usage:
 *   import TripHistory from "@/components/history/TripHistory";
 *   <TripHistory />
 */

import { useEffect, useState } from "react";
import { devicesApi, tripsApi, type Device, type Trip } from "@/lib/api";
import dynamic from "next/dynamic";

const TraccarMap = dynamic(() => import("@/components/map/TraccarMap"), { ssr: false });

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}ц ${m}мин` : `${m}мин`;
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} км` : `${Math.round(meters)} м`;
}

export default function TripHistory() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number }> | undefined>(undefined);
  const [routeLoading, setRouteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    devicesApi.list().then(setDevices).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedTrip) {
      setRoutePoints(undefined);
      return;
    }

    const loadRoute = async () => {
      setRouteLoading(true);
      try {
        const points = await tripsApi.route(
          selectedTrip.deviceId,
          selectedTrip.startTime,
          selectedTrip.endTime,
        );
        setRoutePoints(points);
      } catch (e: any) {
        setError(e.message);
        setRoutePoints(undefined);
      } finally {
        setRouteLoading(false);
      }
    };

    loadRoute();
  }, [selectedTrip]);

  const loadTrips = async () => {
    if (!selectedDevice) return;
    setLoading(true);
    setSelectedTrip(null);
    try {
      const list = await tripsApi.fetch(
        selectedDevice,
        `${from}T00:00:00Z`,
        `${to}T23:59:59Z`
      );
      setTrips(list);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Замын түүх</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-2">
          <label className="text-xs text-zinc-500 mb-1 block">Мал</label>
          <select
            className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDevice ?? ""}
            onChange={e => setSelectedDevice(Number(e.target.value) || null)}
          >
            <option value="">— Мал сонгох —</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Эхлэх огноо</label>
          <input
            type="date"
            className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Дуусах огноо</label>
          <input
            type="date"
            className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={loadTrips}
        disabled={!selectedDevice || loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition font-medium"
      >
        {loading ? "Хайж байна…" : "Хайх"}
      </button>

      {/* Results */}
      {trips.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trip list */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {trips.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setSelectedTrip(t)}
                className={`w-full text-left border rounded-xl px-4 py-3 transition hover:shadow-sm ${
                  selectedTrip?.id === t.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-600">Аялал #{i + 1}</span>
                  <span className="text-xs text-zinc-400">
                    {new Date(t.startTime).toLocaleDateString("mn-MN")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <div>
                    <span className="block text-zinc-400">Зай</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatDistance(t.distance)}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400">Хугацаа</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatDuration(t.duration)}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400">Дунд хурд</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{t.averageSpeed.toFixed(1)} км/ц</span>
                  </div>
                </div>
                {t.startAddress && (
                  <p className="text-xs text-zinc-400 truncate mt-1">📍 {t.startAddress}</p>
                )}
              </button>
            ))}
          </div>

          {/* Route map */}
          <div className="rounded-xl overflow-hidden border dark:border-zinc-700 h-[480px]">
            {selectedTrip ? (
              routeLoading ? (
                <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                  Маршрут уншиж байна…
                </div>
              ) : routePoints?.length ? (
                <TraccarMap className="h-full w-full" routePoints={routePoints} deviceId={selectedTrip.deviceId} />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                  Аяллын маршрут олдсонгүй
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                Аяллыг сонгоно уу
              </div>
            )}
          </div>
        </div>
      )}

      {trips.length === 0 && !loading && selectedDevice && (
        <div className="text-center py-10 text-zinc-400 text-sm">
          <div className="text-4xl mb-2">🗺️</div>
          Сонгосон хугацаанд аялал олдсонгүй
        </div>
      )}
    </div>
  );
}
