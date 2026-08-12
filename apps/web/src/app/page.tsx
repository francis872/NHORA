import Link from "next/link";
import { ShieldAlert, LifeBuoy, MapPin, MessageCircle, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

const actions = [
  {
    href: "/safe",
    label: "ESTOY A SALVO",
    icon: ShieldAlert,
    variant: "outline" as const,
  },
  {
    href: "/sos",
    label: "NECESITO AYUDA",
    icon: LifeBuoy,
    variant: "critical" as const,
  },
  {
    href: "/report",
    label: "REPORTAR INCIDENTE",
    icon: MapPin,
    variant: "glass" as const,
  },
  {
    href: "/chat",
    label: "HABLAR CON NORA",
    icon: MessageCircle,
    variant: "glass" as const,
  },
  {
    href: "/map",
    label: "VER MAPA",
    icon: MapIcon,
    variant: "glass" as const,
  },
];

export default function CitizenHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <GlassPanel intensity="liquid-glass" className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">NORA</h1>
        <p className="mt-2 text-lg text-muted-foreground">¿Estás a salvo?</p>
      </GlassPanel>

      <GlassPanel className="flex flex-col gap-3">
        {actions.map(({ href, label, icon: Icon, variant }) => (
          <Link key={href} href={href}>
            <Button variant={variant} size="lg" className="w-full justify-start">
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Button>
          </Link>
        ))}
      </GlassPanel>

      <p className="text-center text-xs text-muted-foreground">
        NORA es una plataforma de información y coordinación. No sustituye a los organismos
        oficiales de emergencia.
      </p>
    </main>
  );
}
