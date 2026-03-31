import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaBootstrap } from "@/components/PwaBootstrap";
import { IosInstallHint } from "@/components/IosInstallHint";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cidade da Beira - Plataforma de Transparência",
  description: "Plataforma municipal de reporte de ocorrências e transparência",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/pwa-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/pwa-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Beira",
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
