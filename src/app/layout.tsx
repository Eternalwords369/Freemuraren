import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/instrument-sans";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: {
    default: "THE LIVING COSMOS — Personal Codex",
    template: "%s · THE LIVING COSMOS",
  },
  description: "En modern karta över medvetandets evolution. En personlig kunskapsplattform för filosofi, symbolik och idéhistoria.",
  applicationName: "THE LIVING COSMOS — Personal Codex",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
