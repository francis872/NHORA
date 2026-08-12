"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { getMyReports, type MyReport } from "@/lib/my-reports";

export default function MyReportsPage() {
  const [reports, setReports] = useState<MyReport[]>([]);

  useEffect(() => {
    setReports(getMyReports());
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Mis reportes y mensajes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí encuentras tus reportes y solicitudes de SOS enviados desde este dispositivo, y puedes
          seguir hablando con el equipo de atención sobre cada uno.
        </p>
      </div>

      {reports.length === 0 && (
        <GlassPanel className="text-center text-sm text-muted-foreground">
          Aún no has enviado ningún reporte o SOS desde este dispositivo.
        </GlassPanel>
      )}

      <div className="flex flex-col gap-3">
        {reports.map((report) => (
          <Link key={report.id} href={`/incidents/${report.id}`}>
            <GlassPanel className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {report.kind === "SOS" ? "SOS" : report.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <MessageSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
            </GlassPanel>
          </Link>
        ))}
      </div>

      <Link href="/">
        <Button variant="outline" className="w-full">
          Volver al inicio
        </Button>
      </Link>
    </main>
  );
}
