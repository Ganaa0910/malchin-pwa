import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { HerdList } from "@/components/herd/HerdList";
import { mn } from "@/lib/i18n/mn";

export default function HerdPage() {
  return (
    <>
      <ScreenHeader title={mn.herd.title} subtitle="Бүгд 248" />
      <HerdList />
    </>
  );
}
