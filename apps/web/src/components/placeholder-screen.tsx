import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

export function PlaceholderScreen({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <GlassPanel className="flex flex-col gap-6 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{phase}</p>
        <Link href="/">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al inicio
          </Button>
        </Link>
      </GlassPanel>
    </main>
  );
}
