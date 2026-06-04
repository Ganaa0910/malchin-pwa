"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { cn } from "@/lib/utils";
import { getDb } from "@/lib/db";
import { mn } from "@/lib/i18n/mn";

export function DeviceAlertsPanel() {
  const data = useLiveQuery(async () => {
    const db = getDb();
    const [low, bases] = await Promise.all([
      db.devices.where("battery").below(15).toArray(),
      db.devices.where("type").equals("base-station").toArray(),
    ]);
    return {
      lowCollars: low.filter((d) => d.type === "collar"),
      offlineBases: bases.filter((b) => !b.online),
    };
  }, []);

  if (!data) return null;
  const { lowCollars, offlineBases } = data;
  const empty = lowCollars.length === 0 && offlineBases.length === 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="mb-2 text-sm font-bold">{mn.device.warningsTitle}</h3>
      {empty ? (
        <p className="py-6 text-center font-mono text-sm text-mut">
          {mn.device.allNormal}
        </p>
      ) : (
        <div>
          {lowCollars.slice(0, 8).map((d) => (
            <Row
              key={d.id}
              id={d.id}
              href={d.animalId ? `/herd/${d.animalId}` : undefined}
              text={`→ ${d.animalId ?? "—"} · цэнэг ${d.battery}%`}
              tag={mn.device.draining.toUpperCase()}
            />
          ))}
          {offlineBases.map((b) => (
            <Row
              key={b.id}
              id={b.id}
              text={`${mn.device.baseStation} · ${mn.device.statusOffline}`}
              tag={mn.device.statusOffline.toUpperCase()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  id,
  text,
  tag,
  href,
}: {
  id: string;
  text: string;
  tag: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="font-mono text-[11px] font-semibold text-info">{id}</span>
      <span className="min-w-0 truncate font-mono text-[11px] text-ink">
        {text}
      </span>
      <span className="rounded-[3px] bg-danger-soft px-1.5 py-0.5 font-mono text-[9px] font-bold text-danger">
        {tag}
      </span>
    </>
  );
  const cls =
    "grid grid-cols-[auto_1fr_auto] items-center gap-3.5 border-b border-dashed border-line py-2.5 last:border-0";
  return href ? (
    <Link href={href} className={cn(cls, "transition-opacity hover:opacity-80")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
