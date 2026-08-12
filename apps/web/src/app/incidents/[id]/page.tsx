"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { API_ROUTES, authFetch } from "@/lib/api";
import { getIdentity } from "@/lib/identity";
import { INCIDENT_TYPE_LABELS } from "@/lib/incident-labels";

const STATUS_LABELS: Record<string, string> = {
  REPORTED: "Reportado",
  PENDING_VERIFICATION: "En revisión",
  VERIFIED: "Verificado",
  IN_PROGRESS: "En atención",
  RESOLVED: "Resuelto",
  REJECTED: "Rechazado",
  DUPLICATE: "Duplicado",
};

interface IncidentInfo {
  id: string;
  type: keyof typeof INCIDENT_TYPE_LABELS;
  status: string;
  description: string;
  createdAt: string;
}

interface MessageItem {
  id: string;
  senderRole: "CITIZEN" | "OPERATOR";
  senderName: string | null;
  body: string;
  createdAt: string;
}

export default function IncidentThreadPage() {
  const params = useParams<{ id: string }>();
  const incidentId = params.id;
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const identity = getIdentity();

  const incidentQuery = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: async (): Promise<IncidentInfo | null> => {
      const url = new URL(API_ROUTES.incident(incidentId));
      url.searchParams.set("deviceId", identity.deviceId);
      const res = await authFetch(url.toString());
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 15_000,
  });

  const messagesQuery = useQuery({
    queryKey: ["incident", incidentId, "messages"],
    queryFn: async (): Promise<MessageItem[]> => {
      const url = new URL(API_ROUTES.incidentMessages(incidentId));
      url.searchParams.set("deviceId", identity.deviceId);
      const res = await authFetch(url.toString());
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5_000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data?.length]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await authFetch(API_ROUTES.incidentMessages(incidentId), {
        method: "POST",
        body: JSON.stringify({ body, senderName: identity.displayName, deviceId: identity.deviceId }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message ?? "No se pudo enviar el mensaje.");
      }
      setText("");
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId, "messages"] });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const incident = incidentQuery.data;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 py-6">
      <GlassPanel className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">
          {incident ? INCIDENT_TYPE_LABELS[incident.type] ?? "Reporte" : "Reporte"}
        </h1>
        {incident && (
          <p className="text-sm text-muted-foreground">
            Estado: <span className="font-medium text-foreground">{STATUS_LABELS[incident.status] ?? incident.status}</span>
          </p>
        )}
        {!incidentQuery.isLoading && !incident && (
          <p className="text-sm text-critical">
            No se encontró este reporte o no tienes acceso a esta conversación.
          </p>
        )}
      </GlassPanel>

      <GlassPanel className="flex min-h-[50vh] flex-1 flex-col gap-3 overflow-y-auto">
        {messagesQuery.isLoading && (
          <div className="flex justify-center py-6">
            <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}
        {messagesQuery.data?.length === 0 && !messagesQuery.isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no hay mensajes. Escribe para contactar al equipo de atención.
          </p>
        )}
        {messagesQuery.data?.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              message.senderRole === "OPERATOR"
                ? "self-start bg-primary/20 text-foreground"
                : "self-end bg-critical/20 text-foreground"
            }`}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {message.senderRole === "OPERATOR" ? message.senderName ?? "Operador" : "Tú"}
            </p>
            <p>{message.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </GlassPanel>

      <div className="flex gap-2">
        <Input
          placeholder="Escribe un mensaje…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <Button onClick={handleSend} disabled={sending || !text.trim()}>
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      {sendError && <p className="text-xs text-critical">{sendError}</p>}
    </main>
  );
}
