import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { mn } from "@/lib/i18n/mn";

export default function WeatherPage() {
  return (
    <>
      <ScreenHeader title={mn.nav.weather} subtitle="Хэнтий · Хэрлэн" />
      <section className="px-5 py-6">
        <div className="rounded-md border-card bg-card text-card-foreground p-8 text-center">
          <p className="text-sm text-muted-foreground">
            M9 — 7 хоногийн урьдчилсан мэдээ, зуданы эрсдэл
          </p>
        </div>
      </section>
    </>
  );
}
