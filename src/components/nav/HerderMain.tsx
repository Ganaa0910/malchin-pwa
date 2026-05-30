"use client";

import { usePathname } from "next/navigation";

/**
 * Content region of the herder shell.
 * - Dashboard ("/") renders full-bleed so the map fills the area.
 * - Every other page gets a centered, readable column that widens on desktop.
 */
export function HerderMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const fullBleed = pathname === "/";

  return (
    <main className="relative min-w-0 flex-1">
      {fullBleed ? (
        children
      ) : (
        <div className="mx-auto w-full max-w-[420px] md:max-w-2xl">
          {children}
        </div>
      )}
    </main>
  );
}
