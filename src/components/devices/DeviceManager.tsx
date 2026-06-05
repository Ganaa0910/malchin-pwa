"use client";

/**
 * DeviceManager — Add, rename, delete GPS collar devices
 * Drop into: src/components/devices/DeviceManager.tsx
 *
 * Usage:
 *   import DeviceManager from "@/components/devices/DeviceManager";
 *   <DeviceManager />
 */

import { useEffect, useState } from "react";
import { devicesApi, type Device } from "@/lib/api";
import { DeviceImportDialog } from "@/components/devices/DeviceImportDialog";

const CATEGORIES = ["cow", "truck", "car", "person", "default"] as const;

const STATUS_COLOR: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-zinc-400",
  unknown: "bg-yellow-400",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Онлайн",
  offline: "Офлайн",
  unknown: "Тодорхойгүй",
};

export default function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", uniqueId: "", category: "cow", phone: "" });
  const [editName, setEditName] = useState("");

  const load = async () => {
    try {
      const list = await devicesApi.list();
      setDevices(list);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.uniqueId.trim()) {
      setError("Нэр болон ID заавал шаардлагатай");
      return;
    }
    try {
      setError(null);
      await devicesApi.create({ name: form.name, uniqueId: form.uniqueId, category: form.category, phone: form.phone || undefined });
      setForm({ name: "", uniqueId: "", category: "cow", phone: "" });
      setShowAdd(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await devicesApi.update(id, { name: editName });
      setEditId(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" устгахдаа итгэлтэй байна уу?`)) return;
    try {
      await devicesApi.delete(id);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
      Ачааллаж байна…
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">GPS Зах ({devices.length})</h2>
        <div className="flex gap-2">
          <DeviceImportDialog />
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-lg transition"
          >
            <span className="text-base leading-none">+</span>
            Шинэ зах
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="border dark:border-zinc-700 rounded-xl p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Шинэ GPS зах бүртгэх</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-zinc-500 mb-1 block">Малын нэр *</label>
              <input
                className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Жишээ: Буурал 01"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Захны IMEI / ID *</label>
              <input
                className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="123456789012345"
                value={form.uniqueId}
                onChange={e => setForm(f => ({ ...f, uniqueId: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Утасны дугаар</label>
              <input
                className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+97611223344"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
            >
              Бүртгэх
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

      {/* Device list */}
      {devices.length === 0 ? (
        <div className="text-center py-10 text-zinc-400 text-sm">
          <div className="text-4xl mb-2">🐄</div>
          Одоогоор GPS зах бүртгэлгүй байна
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map(dev => (
            <div
              key={dev.id}
              className="flex items-center gap-3 border dark:border-zinc-700 rounded-xl px-4 py-3 bg-white dark:bg-zinc-900 hover:shadow-sm transition"
            >
              {/* Status dot */}
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLOR[dev.status ?? "unknown"]}`} />

              {/* Name / edit */}
              <div className="flex-1 min-w-0">
                {editId === dev.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      className="border dark:border-zinc-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleRename(dev.id)}
                      autoFocus
                    />
                    <button onClick={() => handleRename(dev.id)} className="text-blue-600 text-sm font-medium">Хадгалах</button>
                    <button onClick={() => setEditId(null)} className="text-zinc-400 text-sm">Болих</button>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-sm truncate">{dev.name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {dev.uniqueId} · {STATUS_LABEL[dev.status ?? "unknown"]}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {editId !== dev.id && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditId(dev.id); setEditName(dev.name); }}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition"
                  >
                    Нэр өөрчлөх
                  </button>
                  <button
                    onClick={() => handleDelete(dev.id, dev.name)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition"
                  >
                    Устгах
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
