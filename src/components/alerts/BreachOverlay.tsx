"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useAppStore } from "@/lib/store/useAppStore";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";

export function BreachOverlay() {
  const router = useRouter();
  const activeBreachId = useAppStore((s) => s.activeBreachId);
  const dismissBreach = useAppStore((s) => s.dismissBreach);

  const data = useLiveQuery(async () => {
    if (!activeBreachId) return null;
    const alert = await getDb().alerts.get(activeBreachId);
    if (!alert) return null;
    const animal = alert.animalId
      ? await getDb().animals.get(alert.animalId)
      : null;
    return { alert, animal };
  }, [activeBreachId]);

  // Lock body scroll while overlay is up
  useEffect(() => {
    if (!activeBreachId) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [activeBreachId]);

  if (!activeBreachId || !data) return null;
  const { alert, animal } = data;

  const name = animal?.name ?? animal?.id ?? "Тодорхойгүй";
  const lat = alert.lat ?? animal?.lat;
  const lng = alert.lng ?? animal?.lng;

  async function ack() {
    if (!alert) return;
    await getDb().alerts.update(alert.id, { acknowledged: true });
    await getDb().syncQueue.add({
      kind: "ack-alert",
      payload: { alertId: alert.id },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    dismissBreach();
  }

  function viewOnMap() {
    if (animal) router.push(`/herd/${animal.id}`);
    dismissBreach();
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby="breach-title"
      aria-describedby="breach-message"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/85 p-5 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={dismissBreach}
    >
      <div
        className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red banner */}
        <div className="flex items-center justify-between gap-3 bg-danger px-5 py-4 text-white">
          <span className="font-mono text-[11px] font-bold tracking-wider">
            ⚠ {mn.breach.bannerTitle}
          </span>
          <span className="font-mono text-[11px] opacity-85">
            {format(new Date(alert.createdAt), "HH:mm:ss")}
          </span>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="size-8" aria-hidden />
          </div>
          <h2
            id="breach-title"
            className="text-center text-2xl font-bold leading-tight"
          >
            {name} {mn.breach.breached}
          </h2>
          <p
            id="breach-message"
            className="mt-2 text-center font-mono text-[13px] leading-relaxed text-mut"
          >
            {animal && `${animal.id} · ${mn.species[animal.species]}`}
            <br />
            {alert.message}
          </p>

          {/* 2x2 info grid */}
          <div className="mt-[18px] grid grid-cols-2 gap-3.5 rounded-[10px] border border-line bg-surface p-3.5">
            <Info
              label={mn.breach.labelDist}
              value={animal ? `${Math.round(animal.distanceFromBaseM)}м` : "—"}
            />
            <Info
              label={mn.breach.labelSpeed}
              value={
                animal
                  ? `${animal.speedKmh.toFixed(1)} ${mn.weather.windUnit}`
                  : "—"
              }
            />
            <Info
              label={mn.breach.labelCoord}
              value={
                lat != null && lng != null
                  ? `${lat.toFixed(2)}°N ${lng.toFixed(2)}°E`
                  : "—"
              }
              small
            />
            <Info label={mn.breach.labelSent} value={mn.breach.channels} />
          </div>

          {/* Actions */}
          <div className="mt-[18px] flex flex-col gap-2">
            <button
              type="button"
              onClick={viewOnMap}
              className="rounded-[9px] bg-ink py-3 font-mono text-[13px] font-bold text-bg"
            >
              {mn.breach.viewOnMap}
            </button>
            <button
              type="button"
              onClick={ack}
              className="rounded-[9px] border border-line bg-transparent py-3 font-mono text-[13px] font-bold text-ink transition-colors hover:bg-bg-2"
            >
              {mn.breach.sendDeter}
            </button>
            <button
              type="button"
              onClick={dismissBreach}
              className="rounded-[9px] border border-line bg-transparent py-3 font-mono text-[13px] font-bold text-ink transition-colors hover:bg-bg-2"
            >
              {mn.breach.snooze}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-mut">
        {label}
      </div>
      <div
        className={`mt-1 font-mono font-bold text-ink ${small ? "text-xs" : "text-sm"}`}
      >
        {value}
      </div>
    </div>
  );
}
