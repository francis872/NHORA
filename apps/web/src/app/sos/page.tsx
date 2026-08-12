"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { API_ROUTES, authFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";

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
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setStep("sending");
    setError(null);
    try {
      const coords = await getCurrentPosition();
      const res = await authFetch(API_ROUTES.sos, {
        method: "POST",
        body: JSON.stringify(coords),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "No se pudo enviar el SOS.");
      }
      const data = await res.json();
      setStatus(data.status);
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
          </>
        )}

        {step === "error" && (
          <>
            <h1 className="text-xl font-semibold">No se pudo enviar el SOS</h1>
            <p className="text-sm text-critical">{error}</p>
            <Button variant="critical" className="w-full" onClick={handleConfirm}>
              Reintentar
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

