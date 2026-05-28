import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { mn } from "@/lib/i18n/mn";

export default function AlertsPage() {
  return (
    <>
      <ScreenHeader title={mn.nav.alerts} />
      <section className="px-5 py-6">
        <div className="rounded-md border-card bg-card text-card-foreground p-8 text-center">
          <p className="text-sm text-muted-foreground">
            M8 — мэдэгдлийн жагсаалт, хязгаар давсан гэнэтийн дэлгэц
          </p>
        </div>
      </section>
    </>
  );
}
