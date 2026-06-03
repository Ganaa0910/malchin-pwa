import Link from "next/link";
import {
  PencilRuler,
  Sparkles,
  LogIn,
  UsersRound,
  ShieldCheck,
  LifeBuoy,
  ChevronRight,
} from "lucide-react";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { mn } from "@/lib/i18n/mn";
import owner from "@/data/owner.json";

const LINKS = [
  {
    href: "/geofence",
    label: mn.geofence.title,
    sub: "4 бүс",
    Icon: PencilRuler,
  },
  {
    href: "/onboarding",
    label: "Дахин үзэх",
    sub: "3 алхам",
    Icon: Sparkles,
  },
  {
    href: "/login",
    label: "Нэвтрэх",
    sub: "Жишээ",
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
      <div className="px-4 pt-2 pb-nav space-y-6">
        <section className="rounded-lg border bg-card text-card-foreground p-4">
          <p className="text-xs text-muted-foreground">{mn.profile.owner}</p>
          <p className="text-lg font-semibold mt-0.5">{owner.name}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
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

        <section aria-label={mn.theme.label} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">
            {mn.theme.label}
          </h2>
          <ThemeToggle className="w-full" />
        </section>

        <section aria-label="Бусад" className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">
            Бусад
          </h2>
          <ul className="rounded-lg border bg-card divide-y overflow-hidden">
            {/* Help — mobile only; desktop reaches it from the sidebar */}
            <li className="md:hidden">
              <Link
                href="/help"
                className="tap flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
              >
                <LifeBuoy
                  className="size-4 text-muted-foreground shrink-0"
                  aria-hidden
                />
                <span className="flex-1 min-w-0 text-sm font-medium">
                  {mn.help.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {mn.help.contact.title}
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground shrink-0"
                  aria-hidden
                />
              </Link>
            </li>
            {LINKS.map(({ href, label, sub, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="tap flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                >
                  <Icon
                    className="size-4 text-muted-foreground shrink-0"
                    aria-hidden
                  />
                  <span className="flex-1 min-w-0 text-sm font-medium">
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground">{sub}</span>
                  <ChevronRight
                    className="size-4 text-muted-foreground shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-muted-foreground text-center pt-2 font-mono">
          Belchee v0.0.1
        </p>
      </div>
    </>
  );
}
