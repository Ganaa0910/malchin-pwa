import { mn } from "@/lib/i18n/mn";

/**
 * Mongolian relative time — "Сая", "5 мин өмнө", "3 цагийн өмнө", "2 хоногийн өмнө".
 * Replaces date-fns formatDistanceToNow which only supports English by default.
 */
export function timeAgoMn(input: string | Date): string {
  const t = typeof input === "string" ? new Date(input).getTime() : input.getTime();
  const ms = Date.now() - t;
  const m = Math.round(ms / 60_000);
  if (m < 1) return mn.alerts.justNow;
  if (m < 60) return mn.alerts.minutesAgo(m);
  const h = Math.round(m / 60);
  if (h < 24) return mn.alerts.hoursAgo(h);
  return mn.alerts.daysAgo(Math.round(h / 24));
}

/**
 * Compact form — "5м", "3ц", "2х" — for list rows where space is tight.
 */
export function timeAgoMnShort(input: string | Date): string {
  const t = typeof input === "string" ? new Date(input).getTime() : input.getTime();
  const ms = Date.now() - t;
  const m = Math.round(ms / 60_000);
  if (m < 1) return "одоо";
  if (m < 60) return `${m}м`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}ц`;
  return `${Math.round(h / 24)}х`;
}
