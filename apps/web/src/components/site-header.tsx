"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Persistent NORA mark (PNG) — visible once the app is open, after the SVG splash.
// On any screen other than the home page, an explicit "back" affordance is shown
// next to the logo, since relying on the logo alone to exit a flow isn't discoverable.
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="glass sticky top-0 z-40 flex h-14 items-center justify-between gap-3 px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        {!isHome && (
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        )}
      </div>

      <Link href="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-widest text-foreground">
        <Image src="/brand/nora-logo.png" alt="NORA" width={28} height={28} priority />
        <span className="truncate">NORA</span>
      </Link>
    </header>
  );
}

