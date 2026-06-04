"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * DEV ONLY — floating button to preview the breach overlay.
 * Renders nothing in production. Remove once a real breach trigger exists.
 */
export function BreachDevTrigger() {
  const showBreach = useAppStore((s) => s.showBreach);
  const breachId = useLiveQuery(async () => {
    const db = getDb();
    const breach = await db.alerts.where("type").equals("breach").first();
    if (breach) return breach.id;
    const any = await db.alerts.orderBy("createdAt").reverse().first();
    return any?.id ?? null;
  }, []);

  if (process.env.NODE_ENV !== "development" || !breachId) return null;

  return (
    <button
      type="button"
      onClick={() => showBreach(breachId)}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+92px)] left-3 z-[70] rounded-full border border-danger bg-surface px-3 py-2 font-mono text-[11px] font-bold text-danger shadow-lg md:bottom-3"
    >
      ⚠ Breach (dev)
    </button>
  );
}
