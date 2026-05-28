import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { mn } from "@/lib/i18n/mn";

export default function HerdPage() {
  return (
    <>
      <ScreenHeader title={mn.nav.herd} subtitle="248 мал" />
      <section className="px-5 py-6">
        <div className="rounded-md border-card bg-card text-card-foreground p-8 text-center">
          <p className="text-sm text-muted-foreground">
            M7 — хайлт, статус шүүлт, малын картууд
          </p>
        </div>
      </section>
    </>
  );
}
