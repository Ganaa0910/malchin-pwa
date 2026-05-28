import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { mn } from "@/lib/i18n/mn";

export default function DashboardPage() {
  return (
    <>
      <ScreenHeader title={mn.nav.home} subtitle="Хэнтий · Хэрлэн" />
      <Dashboard />
    </>
  );
}
