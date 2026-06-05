"use client";

/**
 * Example page that wires together all components.
 *
 * Option A — Replace your existing map page (e.g. src/app/map/page.tsx)
 * Option B — Use as a reference to copy pieces into existing pages
 *
 * Tabs:
 *   🗺  Газрын зураг  — Live map with all devices + geofences
 *   🐄  Малын зах     — Add / rename / delete devices
 *   📍  Хориглох бүс  — Add / delete geofences
 *   📜  Замын түүх    — Trip history + route viewer
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import DeviceManager from "@/components/devices/DeviceManager";
import GeofenceManager from "@/components/geofences/GeofenceManager";
import TripHistory from "@/components/history/TripHistory";

// Leaflet must be loaded client-side only
const TraccarMap = dynamic(() => import("@/components/map/TraccarMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-zinc-400 text-sm animate-pulse">
      Газрын зураг ачааллаж байна…
    </div>
  ),
});

const TABS = [
  { id: "map",       label: "🗺  Газрын зураг" },
  { id: "devices",   label: "🐄  Малын зах" },
  { id: "geofences", label: "📍  Хориглох бүс" },
  { id: "history",   label: "📜  Замын түүх" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function MalchinDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("map");

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Tab bar */}
      <nav className="flex border-b dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
              activeTab === tab.id
                ? "border-green-600 text-green-700 dark:text-green-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {/* Map tab — full height */}
        {activeTab === "map" && (
          <div className="h-full">
            <TraccarMap className="h-full w-full" />
          </div>
        )}

        {/* Other tabs — scrollable panel */}
        {activeTab !== "map" && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6">
              {activeTab === "devices"   && <DeviceManager />}
              {activeTab === "geofences" && <GeofenceManager />}
              {activeTab === "history"   && <TripHistory />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
