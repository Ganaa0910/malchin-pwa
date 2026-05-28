import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { mn } from "@/lib/i18n/mn";

export default function DashboardPage() {
  return (
    <>
      <ScreenHeader title={mn.nav.home} subtitle="Хэнтий · Хэрлэн" />
      <section className="px-5 py-6">
        <div className="rounded-md border-card bg-card text-card-foreground p-8 text-center">
          <p className="text-sm text-muted-foreground">
            M6 — газрын зураг, малын тэмдэг, статус хуудас
          </p>
        </div>
      </section>
    </>
  );
}
