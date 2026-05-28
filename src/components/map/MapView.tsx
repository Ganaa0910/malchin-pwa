"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { MapViewLeafletProps } from "./MapViewLeaflet";

export interface MapViewProps extends MapViewLeafletProps {
  height?: string | number;
  className?: string;
}

const MapViewLeaflet = dynamic(() => import("./MapViewLeaflet"), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 bg-muted" />,
});

export function MapView({
  height = "100%",
  className,
  ...props
}: MapViewProps) {
  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      <MapViewLeaflet {...props} />
    </div>
  );
}
