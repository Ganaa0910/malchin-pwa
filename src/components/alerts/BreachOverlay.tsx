"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ShieldAlert, MapPin, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";
import { cn } from "@/lib/utils";

export function BreachOverlay() {
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

  async function handleAcknowledge() {
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

  return (
    <div
      role="alertdialog"
      aria-labelledby="breach-title"
      aria-describedby="breach-message"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-[60] flex flex-col",
        "bg-destructive text-destructive-foreground",
        "animate-in fade-in duration-200",
      )}
    >
      <div className="pt-safe pb-safe flex-1 flex flex-col">
        <header className="px-5 pt-6 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-destructive-foreground/15 flex items-center justify-center animate-pulse">
              <ShieldAlert className="size-6" aria-hidden />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80">
                {mn.alertPriority.critical}
              </p>
              <h1
                id="breach-title"
                className="text-2xl leading-tight"
              >
                {mn.breach.title}
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissBreach}
            aria-label={mn.breach.dismiss}
            className="tap size-11 rounded-full flex items-center justify-center bg-destructive-foreground/15 active:scale-95"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 px-5 flex flex-col justify-center gap-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wider opacity-75">
              {alert.title}
            </p>
            <p
              id="breach-message"
              className="text-3xl leading-tight"
            >
              {animal?.name ?? animal?.id ?? "Тодорхойгүй"}
            </p>
            {animal && (
              <p className="text-sm opacity-85">
                {mn.species[animal.species]} ·{" "}
                <span className="font-mono">{animal.tag}</span>
              </p>
            )}
          </div>

          <p className="text-base leading-relaxed opacity-95">
            {alert.message}
          </p>
        </div>

        <div className="px-5 pb-6 grid grid-cols-1 gap-2.5">
          {animal && (
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="tap w-full"
              onClick={dismissBreach}
            >
              <Link href={`/herd/${animal.id}`}>
                <MapPin className="size-4 mr-1" aria-hidden />
                {mn.breach.locate}
              </Link>
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            className="tap w-full bg-destructive-foreground text-destructive border-destructive-foreground hover:bg-destructive-foreground/90"
            onClick={handleAcknowledge}
          >
            <Zap className="size-4 mr-1" aria-hidden />
            {mn.breach.deter}
          </Button>
        </div>
      </div>
    </div>
  );
}
