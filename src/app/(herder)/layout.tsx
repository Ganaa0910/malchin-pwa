import { BottomNav } from "@/components/nav/BottomNav";
import { DbBootstrap } from "@/components/db/DbBootstrap";

/**
 * Herder shell — wraps the 6 herder routes.
 *
 * Layout contract:
 *   - Max width 420px, centered.
 *   - Reserve 76px (nav + safe area) at the bottom so content
 *     never hides behind BottomNav.
 *   - Top safe-area handled by individual screens (some need a
 *     custom title bar; the Dashboard's MapView extends to the top edge).
 */
export default function HerderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[420px] min-h-dvh">
      <DbBootstrap />
      <div className="pb-[calc(env(safe-area-inset-bottom)+76px)]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
