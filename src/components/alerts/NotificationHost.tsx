"use client";

import { useEffect } from "react";
import { BellRing, TriangleAlert, X } from "lucide-react";
import { useNotifications, type Notice } from "@/lib/store/useNotifications";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const TTL_MS: Record<Notice["kind"], number> = {
  warn: 6500,
  deter: 9000,
  info: 5000,
};

/**
 * Renders proximity notifications.
 *  - Desktop / notebook (md+): stacked in the top-right corner.
 *  - Mobile: centred in the middle of the screen.
 */
export function NotificationHost() {
  const notices = useNotifications((s) => s.notices);
  const isMobile = useIsMobile();

  if (notices.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[130] flex flex-col gap-2",
        isMobile
          ? "inset-x-0 top-1/2 -translate-y-1/2 items-center px-5"
          : "right-4 top-4 items-end",
      )}
      aria-live="assertive"
      role="region"
    >
      {notices.map((n) => (
        <NoticeCard key={n.id} notice={n} mobile={isMobile} />
      ))}
    </div>
  );
}

function NoticeCard({ notice, mobile }: { notice: Notice; mobile: boolean }) {
  const dismiss = useNotifications((s) => s.dismiss);
  const danger = notice.kind === "deter";

  useEffect(() => {
    const t = setTimeout(() => dismiss(notice.id), TTL_MS[notice.kind]);
    return () => clearTimeout(t);
  }, [notice.id, notice.kind, dismiss]);

  const Icon = danger ? BellRing : TriangleAlert;

  return (
    <div
      role="alert"
      onClick={() => dismiss(notice.id)}
      className={cn(
        "pointer-events-auto w-full cursor-pointer overflow-hidden rounded-xl border bg-bg shadow-lg backdrop-blur",
        "animate-in fade-in zoom-in-95 duration-200",
        mobile ? "max-w-[360px]" : "max-w-[340px]",
        mobile && "slide-in-from-top-2",
        !mobile && "slide-in-from-right-3",
        danger ? "border-danger/40" : "border-amber/40",
      )}
    >
      <div className="flex items-stretch">
        <div
          className={cn(
            "flex w-11 shrink-0 items-center justify-center",
            danger ? "bg-danger text-white" : "bg-amber text-white",
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1 px-3 py-2.5">
          <p
            className={cn(
              "text-[13px] font-bold leading-tight",
              danger ? "text-danger" : "text-ink",
            )}
          >
            {notice.title}
          </p>
          {notice.body && (
            <p className="mt-0.5 font-mono text-[11px] leading-snug text-mut">
              {notice.body}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Хаах"
          onClick={(e) => {
            e.stopPropagation();
            dismiss(notice.id);
          }}
          className="flex w-9 shrink-0 items-center justify-center text-mut transition-colors hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
