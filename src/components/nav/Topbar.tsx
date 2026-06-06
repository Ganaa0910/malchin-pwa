import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shell topbar (Warm Paper `.tbar`). Full-width sticky header with title,
 * optional mono sub, LIVE badge, and right-aligned action icons.
 */
export function Topbar({
  title,
  sub,
  live,
  right,
  className,
}: {
  title: ReactNode;
  sub?: ReactNode;
  live?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-3.5 border-b border-line bg-bg/85 px-4 pb-4 backdrop-blur md:px-5 md:pb-5",
        "[padding-top:max(1rem,env(safe-area-inset-top))] md:[padding-top:max(1.25rem,env(safe-area-inset-top))]",
        className,
      )}
    >
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {sub && <span className="font-mono text-[11px] text-mut">{sub}</span>}
      {live && (
        <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-success-soft px-1.5 py-1 font-mono text-[10px] font-bold tracking-wide text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          {live}
        </span>
      )}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </header>
  );
}

/** Square action button used in the topbar's right slot. */
export function TopbarIcon({
  children,
  dot,
  ...props
}: React.ComponentProps<"button"> & { dot?: boolean }) {
  return (
    <button
      type="button"
      className="relative flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition-colors hover:bg-bg-2 [&_svg]:size-4"
      {...props}
    >
      {children}
      {dot && (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />
      )}
    </button>
  );
}
