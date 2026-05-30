"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import { NAV_TABS } from "./tabs";

/** Desktop primary nav — left rail. Hidden below md, where BottomNav takes over. */
export function SideNav() {
  const pathname = usePathname() ?? "/";

  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col sticky top-0 h-dvh border-r bg-background">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10">
          <MapPinned className="size-5 text-primary" />
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-base font-semibold tracking-tight">
            {mn.app.name}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {mn.app.tagline}
          </span>
        </span>
      </div>

      {/* Links */}
      <nav aria-label="Цэс" className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV_TABS.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "tap flex items-center gap-3 rounded-md px-3 text-sm transition-colors",
                    active
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("size-5 shrink-0", active && "text-primary")}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
