"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinned, Layers, Bell, CloudSun, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";

type Tab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/", label: mn.nav.home, Icon: MapPinned, match: (p) => p === "/" },
  {
    href: "/herd",
    label: mn.nav.herd,
    Icon: Layers,
    match: (p) => p.startsWith("/herd"),
  },
  {
    href: "/alerts",
    label: mn.nav.alerts,
    Icon: Bell,
    match: (p) => p.startsWith("/alerts"),
  },
  {
    href: "/weather",
    label: mn.nav.weather,
    Icon: CloudSun,
    match: (p) => p.startsWith("/weather"),
  },
  {
    href: "/profile",
    label: mn.nav.profile,
    Icon: UserRound,
    match: (p) => p.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Цэс"
      className="fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur border-t pb-safe"
    >
      <ul className="mx-auto max-w-[420px] grid grid-cols-5">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="contents">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "tap flex flex-col items-center justify-center gap-1 py-2",
                  "text-[11px] leading-none transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors",
                    active ? "text-primary" : "",
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className={cn(active && "font-medium")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
