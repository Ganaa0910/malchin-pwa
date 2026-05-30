import { SideNav } from "@/components/nav/SideNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { HerderMain } from "@/components/nav/HerderMain";
import { DbBootstrap } from "@/components/db/DbBootstrap";

/**
 * Herder shell — responsive.
 * - Mobile: single column, sticky BottomNav at the bottom.
 * - Desktop (md+): left SideNav rail + main content filling the rest.
 * HerderMain decides per-route whether content is full-bleed (map) or a
 * centered column (lists). Scrollable pages use `.pb-nav` for bottom padding.
 */
export default function HerderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="md:flex md:min-h-dvh">
      <DbBootstrap />
      <SideNav />
      <HerderMain>{children}</HerderMain>
      <BottomNav />
    </div>
  );
}
