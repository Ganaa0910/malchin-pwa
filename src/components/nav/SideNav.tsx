"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
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
        {/* Brand — mark only when collapsed, full lockup when expanded */}
        <Link
          href="/"
          aria-label={mn.app.name}
          className="relative flex h-20 items-center justify-center border-b px-3"
        >
          <span
            aria-hidden
            className="brand-mark size-12 shrink-0 transition-opacity duration-150 group-hover/nav:opacity-0"
          />
          <span
            aria-hidden
            className="brand-logo absolute left-3 top-1/2 h-14 w-52 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/nav:opacity-100"
          />
        </Link>

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

        {/* Secondary — Help */}
        <div className="px-2.5 pb-1">
          <Link
            href="/help"
            aria-current={pathname.startsWith("/help") ? "page" : undefined}
            aria-label={mn.help.title}
            className={cn(
              "tap flex items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
              pathname.startsWith("/help")
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <LifeBuoy
              className={cn(
                "size-5 shrink-0",
                pathname.startsWith("/help") && "text-primary",
              )}
              strokeWidth={pathname.startsWith("/help") ? 2.25 : 1.75}
            />
            <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/nav:opacity-100">
              {mn.help.title}
            </span>
          </Link>
        </div>

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
