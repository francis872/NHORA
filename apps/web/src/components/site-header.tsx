import Image from "next/image";
import Link from "next/link";

// Persistent NORA mark (PNG) — visible once the app is open, after the SVG splash.
export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40 flex h-14 items-center px-4">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/brand/nora-logo.png" alt="NORA" width={28} height={28} priority />
        <span className="text-sm font-semibold tracking-widest text-foreground">NORA</span>
      </Link>
    </header>
  );
}
