"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  MapPinned,
  Layers,
  Hexagon,
  Bell,
  CloudSun,
  UserRound,
  LifeBuoy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import { useAnimals, useAlerts, usePolygons, useOwner } from "@/lib/db/hooks";
import { geofencesApi } from "@/lib/api";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (p: string) => boolean;
  count?: number;
};

/**
 * Desktop primary nav — static grouped sidebar (Warm Paper).
 * Hidden below md, where BottomNav takes over.
 */
export function SideNav() {
  const pathname = usePathname() ?? "/";
  const animals = useAnimals();
  const alerts = useAlerts();
  const polygons = usePolygons();
  const owner = useOwner();
  const [geofenceCount, setGeofenceCount] = useState(0);

  useEffect(() => {
    geofencesApi.list()
      .then((list) => setGeofenceCount(list.length))
      .catch(() => setGeofenceCount(0));
  }, []);

  const main: NavItem[] = [
    { href: "/", label: mn.nav.home, Icon: MapPinned, match: (p) => p === "/" },
    {
      href: "/herd",
      label: mn.nav.herd,
      Icon: Layers,
      match: (p) => p.startsWith("/herd"),
      count: animals.length,
    },
    {
      href: "/polygon",
      label: mn.nav.polygon,
      Icon: Hexagon,
      match: (p) => p.startsWith("/polygon"),
      count: polygons.length + geofenceCount,
    },
    {
      href: "/alerts",
      label: mn.nav.alerts,
      Icon: Bell,
      match: (p) => p.startsWith("/alerts"),
      count: alerts.length,
    },
    {
      href: "/weather",
      label: mn.nav.weather,
      Icon: CloudSun,
      match: (p) => p.startsWith("/weather"),
    },
  ];

  const settings: NavItem[] = [
    {
      href: "/profile",
      label: mn.nav.profile,
      Icon: UserRound,
      match: (p) => p.startsWith("/profile"),
    },
    {
      href: "/help",
      label: mn.help.title,
      Icon: LifeBuoy,
      match: (p) => p.startsWith("/help"),
    },
  ];

  const name = owner?.name ?? "Малчин";
  const firstName = name.trim().split(" ")[0];
  const initial = name.trim().charAt(0);
  const role = `${mn.profile.owner} · ${owner?.bagh ?? ""}`.trim().toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[230px] shrink-0 flex-col border-r border-line bg-bg-2 px-3.5 py-4 md:flex">
      {/* Logo */}
      <Link
        href="/"
        aria-label={mn.app.name}
        className="flex items-center border-b border-line px-2 pb-4"
      >
        <span aria-hidden className="brand-logo h-8 w-40 shrink-0" />
      </Link>

      {/* Grouped nav */}
      <nav aria-label="Цэс" className="mt-3 flex-1 overflow-y-auto">
        <NavGroup title={mn.nav.groupMain} items={main} pathname={pathname} />
        <NavGroup
          title={mn.nav.groupSettings}
          items={settings}
          pathname={pathname}
        />
      </nav>

      {/* User footer */}
      <div className="mt-auto border-t border-line pt-3">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-[13px] font-bold text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{firstName}</div>
            <div className="truncate font-mono text-[10px] text-mut">{role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="mb-1">
      <div className="px-2.5 pb-1.5 pt-3 font-mono text-[9px] font-semibold uppercase tracking-wider text-mut-2">
        {title}
      </div>
      <ul className="space-y-0.5">
        {items.map(({ href, label, Icon, match, count }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-ink font-semibold text-bg"
                    : "text-ink-2 hover:bg-surface",
                )}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                <span className="flex-1 truncate">{label}</span>
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] font-semibold",
                      active ? "text-bg/70" : "text-mut",
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
