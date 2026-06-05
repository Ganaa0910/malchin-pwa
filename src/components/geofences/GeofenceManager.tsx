"use client";

/**
 * GeofenceManager — List, add and delete geofences
 * Drop into: src/components/geofences/GeofenceManager.tsx
 *
 * Usage:
 *   import GeofenceManager from "@/components/geofences/GeofenceManager";
 *   <GeofenceManager />
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { geofencesApi, type Geofence } from "@/lib/api";

export default function GeofenceManager() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", area: "", priority: "medium" });

  const load = async () => {
    try {
      const list = await geofencesApi.list();
      setGeofences(list);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.area.trim()) {
      setError("Нэр болон хэсэг заавал шаардлагатай");
      return;
    }
    try {
      setError(null);
      await geofencesApi.create({
        name: form.name,
        description: form.description,
        area: form.area,
        attributes: {
          owner: "user",
          priority: form.priority,
        },
      });
      setForm({ name: "", description: "", area: "", priority: "medium" });
      setShowAdd(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" хориглох бүсийг устгах уу?`)) return;
    try {
      await geofencesApi.delete(id);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">Ачааллаж байна…</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Хориглох бүс ({geofences.length})</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg transition"
        >
          <span className="text-base leading-none">+</span>
          Шинэ бүс
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="border dark:border-zinc-700 rounded-xl p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Шинэ хориглох бүс нэмэх</p>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Бүсийн нэр *</label>
            <input
              className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Жишээ: Багануур замын хориглох бүс"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Тайлбар</label>
            <input
              className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Нэмэлт тайлбар…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              WKT POLYGON координат *
              <span className="ml-1 text-zinc-400">(POLYGON((lat lon, lat lon, ...)))</span>
            </label>
            <textarea
              className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-xs"
              rows={3}
              placeholder="POLYGON((47.35 107.41, 47.36 107.43, ...))"
              value={form.area}
              onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Priority</label>
            <select
              className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            >
              <option value="high">Өндөр</option>
              <option value="medium">Дунд</option>
              <option value="low">Бага</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
            >
              Нэмэх
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm px-4 py-2 rounded-lg transition"
            >
              Болих
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {geofences.length === 0 ? (
        <div className="text-center py-10 text-zinc-400 text-sm">
          <div className="text-4xl mb-2">📍</div>
          Хориглох бүс бүртгэлгүй байна
        </div>
      ) : (
        <div className="space-y-2">
          {geofences.map(g => {
            const owned = g.attributes?.owner === "user";
            const priority = String(g.attributes?.priority ?? "medium");
            return (
              <div
                key={g.id}
                className="flex items-center gap-3 border dark:border-zinc-700 rounded-xl px-4 py-3 bg-white dark:bg-zinc-900"
              >
                <div className="w-3 h-3 rounded-sm bg-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{g.name}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                    {g.description && <span className="truncate">{g.description}</span>}
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {owned ? "Миний" : "Систем"}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {priority === "high" ? "Өндөр" : priority === "low" ? "Бага" : "Дунд"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(g.id, g.name)}
                  disabled={!owned}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded-lg transition",
                    owned
                      ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed",
                  )}
                >
                  Устгах
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
