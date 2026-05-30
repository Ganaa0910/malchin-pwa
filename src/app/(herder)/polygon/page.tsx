import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { PolygonScreen } from "@/components/polygon/PolygonScreen";
import { mn } from "@/lib/i18n/mn";

export default function PolygonPage() {
  return (
    <>
      <ScreenHeader title={mn.polygon.title} subtitle={mn.polygon.subtitle} />
      <PolygonScreen />
    </>
  );
}
