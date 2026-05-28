import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { AlertsList } from "@/components/alerts/AlertsList";
import { mn } from "@/lib/i18n/mn";

export default function AlertsPage() {
  return (
    <>
      <ScreenHeader title={mn.alerts.title} />
      <AlertsList />
    </>
  );
}
