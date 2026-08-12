import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AmbientBackground } from "@/components/ambient-background";
import { SplashScreen } from "@/components/splash-screen";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "NORA — Emergency Intelligence Platform",
  description:
    "NORA (Network — Operations — Response — Assistance): plataforma de información, geointeligencia y coordinación durante emergencias.",
  icons: {
    icon: "/brand/nora-logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <Providers>
          <AmbientBackground />
          <SplashScreen />
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
