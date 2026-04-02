import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaBootstrap } from "@/components/PwaBootstrap";
import { IosInstallHint } from "@/components/IosInstallHint";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Beira É Wawa - Plataforma de Governação Aberta",
  applicationName: "Beira É Wawa",
  description: "Plataforma municipal de reporte de ocorrências e transparência",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/pwa-192.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Beira É Wawa",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <Providers>
          <PwaBootstrap />
          <IosInstallHint />
          {/* Android: slim top bar (beforeinstallprompt) — Facebook-style install strip */}
          <InstallPwaBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
