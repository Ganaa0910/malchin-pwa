"use client";

import { useEffect, useState } from "react";
import { Download, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { devicesApi, type Device } from "@/lib/api";
import { getDb } from "@/lib/db/dexie";
import type { Animal } from "@/types/animal";
import type { Herd } from "@/types/owner";
import { mn } from "@/lib/i18n/mn";

interface ImportDevice extends Device {
  selected?: boolean;
}

export function DeviceImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<ImportDevice[]>([]);
  const [herds, setHerds] = useState<Herd[]>([]);
  const [selectedHerd, setSelectedHerd] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadDevicesAndHerds = async () => {
    try {
      setLoading(true);
      setError(null);
      const db = getDb();
      
      // Load devices from Traccar
      const list = await devicesApi.list();
      setDevices(list.map((d) => ({ ...d, selected: true })));
      
      // Load herds from database
      const herdsList = await db.herds.toArray();
      setHerds(herdsList);
      
      // Default to first herd (typically cattle herd)
      if (herdsList.length > 0) {
        setSelectedHerd(herdsList[0].id);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const selectedDevices = devices.filter((d) => d.selected);
    if (selectedDevices.length === 0) {
      setError("Угнуулах төхөөрөмж сонгоно уу");
      return;
    }

    if (!selectedHerd) {
      setError("Сүрэг сонгоно уу");
      return;
    }

    try {
      setImporting(true);
      setError(null);
      const db = getDb();
      
      const herd = herds.find(h => h.id === selectedHerd);
      if (!herd) {
        setError("Сүрэг олдсонгүй");
        return;
      }

      // Import each device and create animal
      for (const device of selectedDevices) {
        const deviceId = `D-T-${device.id}`;
        const animalId = `A-T-${device.id}`;
        
        // Save device
        await db.devices.put({
          id: deviceId,
          serial: device.uniqueId,
          type: "collar",
          animalId: animalId, // Link to new animal
          battery: 0,
          signal: 0,
          firmwareVersion: "Traccar",
          lastPingAt: device.lastUpdate || new Date().toISOString(),
          online: device.status === "online",
        });

        // Create animal for this device and add to herd
        await db.animals.put({
          id: animalId,
          tag: device.uniqueId,
          name: device.name || null,
          species: herd.species as Animal["species"],
          breed: "",
          age: 3,
          sex: Math.random() > 0.5 ? "male" : "female",
          weightKg: 0,
          color: "",
          ownerId: herd.ownerId,
          herdId: selectedHerd,
          deviceId: deviceId,
          lat: 0,
          lng: 0,
          altitudeM: 0,
          lastSeenAt: new Date().toISOString(),
          status: "safe",
          proximity: "SAFE",
          speedKmh: 0,
          distanceFromBaseM: 0,
          healthFlags: [],
        });
      }

      setSuccess(true);
      setOpen(false);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const toggleAll = () => {
    const allSelected = devices.every((d) => d.selected);
    setDevices(devices.map((d) => ({ ...d, selected: !allSelected })));
  };

  const toggleDevice = (id: number) => {
    setDevices(devices.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d)));
  };

  const selectedCount = devices.filter((d) => d.selected).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={loadDevicesAndHerds}
        >
          <Download className="h-4 w-4" />
          Traccar-ээс угнуулах
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>GPS Төхөөрөмжийг угнуулах</DialogTitle>
          <DialogDescription>
            Traccar-ээс идэвхтэй төхөөрөмжүүдийг сүрэгт нэмэх
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error */}
          {error && (
            <div className="flex gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Herd Selector */}
          {!loading && herds.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Сүрэг сонгох</label>
              <select
                value={selectedHerd}
                onChange={(e) => setSelectedHerd(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Сүрэг сонгоно уу</option>
                {herds.map((herd) => (
                  <option key={herd.id} value={herd.id}>
                    {herd.name} ({herd.species}) - {herd.count}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-sm">Ачааллаж байна...</div>
            </div>
          ) : (
            <>
              {/* Select all */}
              <div className="flex items-center justify-between px-2 py-2 border-b">
                <label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={devices.length > 0 && devices.every((d) => d.selected)}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                  Бүгдийг сонгох
                </label>
                <span className="text-xs text-muted-foreground">
                  {selectedCount} / {devices.length}
                </span>
              </div>

              {/* Device list */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {devices.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    Төхөөрөмж олдсонгүй
                  </p>
                ) : (
                  devices.map((device) => (
                    <label
                      key={device.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={device.selected ?? false}
                        onChange={() => toggleDevice(device.id)}
                        className="cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{device.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {device.uniqueId}
                        </p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          device.status === "online"
                            ? "bg-green-500"
                            : device.status === "offline"
                              ? "bg-zinc-400"
                              : "bg-yellow-400"
                        }`}
                      />
                    </label>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={importing}
          >
            Болих
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={importing || devices.length === 0 || selectedCount === 0}
          >
            {importing ? "Угнуулж байна..." : `Угнуулах (${selectedCount})`}
          </Button>
        </div>

        {/* Success message */}
        {success && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✓ {selectedCount} төхөөрөмжийг амжилттай угнуулсан
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
