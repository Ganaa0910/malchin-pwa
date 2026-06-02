"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NAV_TABS } from "./tabs";

/**
 * Desktop primary nav — a collapsed icon rail that expands to reveal text
 * labels on hover. Hidden below md, where BottomNav takes over. A fixed-width
 * spacer reserves the collapsed width so page content doesn't reflow when the
 * rail expands over it.
 */
export function SideNav() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      {/* Spacer — reserves the collapsed width so content never shifts */}
      <div aria-hidden className="hidden w-16 shrink-0 md:block" />

      <aside
        className={cn(
          "group/nav fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-background md:flex",
          "w-16 overflow-hidden transition-[width] duration-200 ease-in-out",
          "hover:w-60 hover:shadow-xl",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b px-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <MapPinned className="size-5 text-primary" />
          </span>
          <span className="flex items-baseline gap-1.5 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/nav:opacity-100">
            <span className="text-base font-semibold tracking-tight">
              {mn.app.name}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {mn.app.tagline}
            </span>
          </span>
        </div>

        {/* Links */}
        <nav aria-label="Цэс" className="flex-1 px-2.5 py-4">
          <ul className="space-y-1">
            {NAV_TABS.map(({ href, label, Icon, match }) => {
              const active = match(pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    aria-label={label}
                    className={cn(
                      "tap flex items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
                      active
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn("size-5 shrink-0", active && "text-primary")}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                    <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/nav:opacity-100">
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Theme — hidden until expanded (segmented control needs the width) */}
        <div className="border-t p-2.5">
          <div className="opacity-0 transition-opacity duration-150 group-hover/nav:opacity-100">
            <ThemeToggle className="w-full" />
          </div>
        </div>
      </aside>
    </>
  );
}
