"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { API_ROUTES, authFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";

type Step = "confirm" | "sending" | "sent" | "error";

export default function SafePage() {
  const [step, setStep] = useState<Step>("confirm");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setStep("sending");
    setError(null);
    try {
      const coords = await getCurrentPosition().catch(() => null);
      const res = await authFetch(API_ROUTES.safetyCheckins, {
        method: "POST",
        body: JSON.stringify(coords ?? {}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "No se pudo registrar tu estado.");
      }
      setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar tu estado.");
      setStep("error");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12 text-center">
      <GlassPanel intensity="liquid-glass" className="flex flex-col items-center gap-4">
        <ShieldAlert className="h-10 w-10 text-primary" aria-hidden />

        {step === "confirm" && (
          <>
            <h1 className="text-xl font-semibold">Marcarme como a salvo</h1>
            <p className="text-sm text-muted-foreground">
              Registraremos tu ubicación aproximada y la hora, para que otros sepan que estás
              bien.
            </p>
            <Button size="lg" className="w-full" onClick={handleConfirm}>
              Confirmar que estoy a salvo
            </Button>
          </>
        )}

        {step === "sending" && (
          <>
            <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden />
            <p className="text-sm text-muted-foreground">Registrando tu estado…</p>
          </>
        )}

        {step === "sent" && (
          <>
            <h1 className="text-xl font-semibold">Registrado</h1>
            <p className="text-sm text-muted-foreground">
              Quedó registrado que estás a salvo. Gracias por confirmar.
            </p>
          </>
        )}

        {step === "error" && (
          <>
            <h1 className="text-xl font-semibold">No se pudo registrar</h1>
            <p className="text-sm text-critical">{error}</p>
            <Button className="w-full" onClick={handleConfirm}>
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
