"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/lib/hooks/useOnline";
import { cn } from "@/lib/utils";

/**
 * Floating offline indicator pinned below the status bar.
 * Hidden when online. Theme-aware via tokens.
 */
export function OfflineBadge({ className }: { className?: string }) {
  const online = useOnline();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 pt-safe flex justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mt-2 flex items-center gap-2 rounded-full",
          "bg-warning text-warning-foreground border-card",
          "px-3 py-1.5 text-sm font-medium",
        )}
        style={{ boxShadow: "var(--shadow-button)" }}
      >
        <WifiOff className="size-4" aria-hidden />
        <span>Сүлжээгүй горим</span>
      </div>
    </div>
  );
}
