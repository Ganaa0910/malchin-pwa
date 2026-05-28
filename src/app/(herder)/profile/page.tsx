import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { ThemeSwitcher } from "@/components/settings/ThemeSwitcher";
import { mn } from "@/lib/i18n/mn";
import owner from "@/data/owner.json";

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

        <p className="text-xs text-muted-foreground text-center pt-2">
          v0.0.1 · MVP
        </p>
      </div>
    </>
  );
}
