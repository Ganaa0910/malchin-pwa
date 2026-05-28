import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { GeofenceEditor } from "@/components/geofence/GeofenceEditor";
import { mn } from "@/lib/i18n/mn";

export default function GeofencePage() {
  return (
    <>
      <ScreenHeader title={mn.geofence.title} subtitle="4 идэвхтэй бүс" />
      <GeofenceEditor />
    </>
  );
}
