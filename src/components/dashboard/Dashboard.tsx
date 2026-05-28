"use client";

import { useMemo, useState } from "react";
import { useAnimals, useZones, useOwner } from "@/lib/db/hooks";
import { MapView } from "@/components/map/MapView";
import { AnimalStatusSheet } from "@/components/animal/AnimalStatusSheet";
import { StatusStrip } from "./StatusStrip";

export function Dashboard() {
  const animals = useAnimals();
  const zones = useZones();
  const owner = useOwner();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => animals.find((a) => a.id === selectedId) ?? null,
    [animals, selectedId],
  );

  const baseLat = owner?.baseLat ?? 48.05;
  const baseLng = owner?.baseLng ?? 109.65;

  return (
    <>
      <div className="px-5 pt-2">
        <StatusStrip animals={animals} />
      </div>

      <div className="px-5 mt-4">
        <div
          className="rounded-md border-card overflow-hidden"
          style={{
            boxShadow: "var(--shadow-card)",
            height: "min(58vh, 460px)",
          }}
        >
          <MapView
            animals={animals}
            zones={zones}
            baseLat={baseLat}
            baseLng={baseLng}
            selectedAnimalId={selectedId}
            onAnimalClick={(id) => setSelectedId(id)}
          />
        </div>
      </div>

      <AnimalStatusSheet
        animal={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
