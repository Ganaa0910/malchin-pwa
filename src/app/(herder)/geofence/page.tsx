import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { mn } from "@/lib/i18n/mn";

export default function GeofencePage() {
  return (
    <>
      <ScreenHeader title={mn.geofence.title} subtitle="4 идэвхтэй бүс" />
      <section className="px-5 py-6">
        <div className="rounded-md border-card bg-card text-card-foreground p-8 text-center">
          <p className="text-sm text-muted-foreground">
            M8 — полигон зурах, буфер бүс
          </p>
        </div>
      </section>
    </>
  );
}
