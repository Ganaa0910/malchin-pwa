import { BottomNav } from "@/components/nav/BottomNav";
import { DbBootstrap } from "@/components/db/DbBootstrap";

/**
 * Herder shell — max-w 420px column, sticky BottomNav.
 * Pages handle their own bottom padding (use `.pb-nav` for scrollable
 * content; the dashboard goes full-bleed and skips it).
 */
export default function HerderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[420px] relative">
      <DbBootstrap />
      {children}
      <BottomNav />
    </div>
  );
}
