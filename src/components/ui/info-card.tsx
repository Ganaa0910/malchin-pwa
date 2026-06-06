import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface InfoCardRow {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  valueCls?: string;
}

interface InfoCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconCls?: string;
  rows: InfoCardRow[];
  className?: string;
}

/**
 * Uniform info card component for displaying data in popup/sheets.
 * Used across animal, device, and other info panels.
 */
export function InfoCard({
  title,
  subtitle,
  icon: Icon,
  iconCls,
  rows,
  className,
}: InfoCardProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with icon and title */}
      {(title || Icon) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {subtitle && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {subtitle}
              </p>
            )}
            {title && (
              <h3 className="text-2xl font-bold leading-tight truncate">
                {title}
              </h3>
            )}
          </div>
          {Icon && (
            <div className={cn("flex-shrink-0 text-2xl text-muted-foreground", iconCls)}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      )}

      {/* Data grid */}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-line bg-surface px-3 py-2"
          >
            {/* Label with icon */}
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
              {row.icon && <row.icon className="size-3.5" aria-hidden />}
              <span className="text-xs">{row.label}</span>
            </div>
            {/* Value */}
            <div className={cn("font-semibold tabular-nums", row.valueCls)}>
              {row.value}
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
