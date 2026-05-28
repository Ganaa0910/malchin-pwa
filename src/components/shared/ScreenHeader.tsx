import { cn } from "@/lib/utils";

export function ScreenHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "pt-safe sticky top-0 z-30 bg-background/85 backdrop-blur",
        "px-4 pt-3 pb-3 border-b",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground leading-tight mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {right && (
          <div className="shrink-0 flex items-center gap-2">{right}</div>
        )}
      </div>
    </header>
  );
}
