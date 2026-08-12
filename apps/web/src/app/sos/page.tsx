"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy, LoaderCircle } from "lucide-react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { NoraMap } from "@/components/map/nora-map";
import { API_ROUTES, authFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import { getIdentity } from "@/lib/identity";
import { addMyReport } from "@/lib/my-reports";

const BOGOTA_CENTER: [number, number] = [-74.0721, 4.711];
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

const STATUS_LABELS: Record<string, string> = {
  REPORTED: "SOS enviado — recibido por el sistema",
  PENDING_VERIFICATION: "En revisión",
  VERIFIED: "Verificado",
  IN_PROGRESS: "En atención",
  RESOLVED: "Resuelto",
};

type Step = "confirm" | "sending" | "sent" | "error";

export default function SosPage() {
  const [step, setStep] = useState<Step>("confirm");
  const [status, setStatus] = useState<string | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCoords, setManualCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [needsManualLocation, setNeedsManualLocation] = useState(false);

  const handleConfirm = async () => {
    setStep("sending");
    setError(null);
    try {
      const coords = manualCoords ?? (await getCurrentPosition().catch(() => null));
      if (!coords) {
        setNeedsManualLocation(true);
        setError("No pudimos obtener tu ubicación. Tócala en el mapa de abajo y confirma de nuevo.");
        setStep("error");
        return;
      }

      const identity = getIdentity();
      const res = await authFetch(API_ROUTES.sos, {
        method: "POST",
        body: JSON.stringify({ ...coords, deviceId: identity.deviceId, reporterName: identity.displayName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "No se pudo enviar el SOS.");
      }
      const data = await res.json();
      setStatus(data.status);
      setIncidentId(data.incidentId);
      addMyReport({
        id: data.incidentId,
        kind: "SOS",
        label: "SOS",
        createdAt: new Date().toISOString(),
      });
      setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el SOS.");
      setStep("error");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12 text-center">
      <GlassPanel intensity="liquid-glass" className="flex flex-col items-center gap-4">
        <LifeBuoy className="h-10 w-10 text-critical" aria-hidden />

        {step === "confirm" && (
          <>
            <h1 className="text-xl font-semibold">¿Necesitas ayuda urgente?</h1>
            <p className="text-sm text-muted-foreground">
              Se compartirá tu ubicación actual y se registrará una alerta prioritaria.
            </p>
            <Button variant="critical" size="lg" className="w-full" onClick={handleConfirm}>
              Confirmar SOS
            </Button>
          </>
        )}

        {step === "sending" && (
          <>
            <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden />
            <p className="text-sm text-muted-foreground">Obteniendo tu ubicación y enviando alerta…</p>
          </>
        )}

        {step === "sent" && (
          <>
            <h1 className="text-xl font-semibold">SOS enviado</h1>
            <p className="text-sm text-muted-foreground">
              Estado: <span className="font-medium text-foreground">{STATUS_LABELS[status ?? ""] ?? status}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              No podemos confirmar que un equipo esté en camino hasta que una entidad autorizada lo verifique.
            </p>
            {incidentId && (
              <Link href={`/incidents/${incidentId}`} className="w-full">
                <Button className="w-full">Hablar con el equipo de atención</Button>
              </Link>
            )}
          </>
        )}

        {step === "error" && (
          <>
            <h1 className="text-xl font-semibold">No se pudo enviar el SOS</h1>
            <p className="text-sm text-critical">{error}</p>
            {needsManualLocation && (
              <div className="w-full overflow-hidden rounded-xl border border-border">
                <NoraMap
                  center={manualCoords ? [manualCoords.longitude, manualCoords.latitude] : BOGOTA_CENTER}
                  incidents={EMPTY_FEATURE_COLLECTION}
                  resources={EMPTY_FEATURE_COLLECTION}
                  className="h-48 w-full"
                  pickedPoint={manualCoords}
                  onPick={(point) => setManualCoords(point)}
                />
                <p className="bg-background/60 px-3 py-2 text-center text-xs text-muted-foreground">
                  Toca el mapa para marcar dónde estás
                </p>
              </div>
            )}
            <Button variant="critical" className="w-full" onClick={handleConfirm}>
              {manualCoords ? "Confirmar con esta ubicación" : "Reintentar"}
            </Button>
          </>
        )}
      </GlassPanel>

      <Link href="/">
        <Button variant="outline" className="w-full">
          Volver al inicio
        </Button>
      </Link>
    </main>
  );
}

