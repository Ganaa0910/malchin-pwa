import Link from "next/link";
import {
  PencilRuler,
  Sparkles,
  LogIn,
  UsersRound,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { ThemeSwitcher } from "@/components/settings/ThemeSwitcher";
import { mn } from "@/lib/i18n/mn";
import owner from "@/data/owner.json";

const LINKS = [
  {
    href: "/geofence",
    label: mn.geofence.title,
    sub: "4 идэвхтэй бүс",
    Icon: PencilRuler,
  },
  {
    href: "/onboarding",
    label: "Танилцуулга үзэх",
    sub: "3 алхам",
    Icon: Sparkles,
  },
  {
    href: "/login",
    label: "Нэвтрэх дэлгэц",
    sub: "Туршилт",
    Icon: LogIn,
  },
  {
    href: "/manager",
    label: mn.manager.title,
    sub: mn.manager.comingSoon,
    Icon: UsersRound,
  },
  {
    href: "/admin",
    label: mn.admin.title,
    sub: mn.admin.comingSoon,
    Icon: ShieldCheck,
  },
] as const;

export default function ProfilePage() {
  return (
    <>
      <ScreenHeader title={mn.nav.profile} />
      <div className="px-5 pt-2 pb-6 space-y-6">
        <section
          className="rounded-md border-card bg-card text-card-foreground p-4 space-y-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {mn.profile.owner}
            </p>
            <p className="font-display text-xl mt-0.5">{owner.name}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{mn.profile.phone}</dt>
            <dd className="font-mono text-right">{owner.phone}</dd>
            <dt className="text-muted-foreground">{mn.profile.aimag}</dt>
            <dd className="text-right">{owner.aimag}</dd>
            <dt className="text-muted-foreground">{mn.profile.sum}</dt>
            <dd className="text-right">{owner.sum}</dd>
            <dt className="text-muted-foreground">{mn.profile.bagh}</dt>
            <dd className="text-right">{owner.bagh}</dd>
            <dt className="text-muted-foreground">{mn.profile.baseCamp}</dt>
            <dd className="text-right">{owner.baseName}</dd>
          </dl>
        </section>

        <section aria-label={mn.profile.theme}>
          <h2 className="font-display text-lg mb-3 px-1">{mn.profile.theme}</h2>
          <ThemeSwitcher />
        </section>

        <section aria-label="Бусад">
          <h2 className="font-display text-lg mb-3 px-1">Бусад</h2>
          <ul className="space-y-2">
            {LINKS.map(({ href, label, sub, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="tap flex items-center gap-3 rounded-md border-card bg-card text-card-foreground px-3 py-2.5 transition-transform active:scale-[0.99]"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <span
                    aria-hidden
                    className="size-9 shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold leading-tight">
                      {label}
                    </span>
                    <span className="block text-xs text-muted-foreground leading-tight mt-0.5">
                      {sub}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 text-muted-foreground shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center pt-2 font-mono">
          Малчин v0.0.1 · MVP
        </p>
      </div>
    </>
  );
}
