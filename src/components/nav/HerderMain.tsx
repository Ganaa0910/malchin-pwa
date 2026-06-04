/**
 * Content region of the herder shell.
 * Full-width beside the sidebar (Warm Paper desktop app layout); each page
 * renders its own Topbar/header + body. The dashboard ("/") fills the area
 * with its full-bleed map.
 */
export function HerderMain({ children }: { children: React.ReactNode }) {
  return <main className="relative min-w-0 flex-1">{children}</main>;
}
