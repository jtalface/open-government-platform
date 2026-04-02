import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaBootstrap } from "@/components/PwaBootstrap";
import { IosInstallHint } from "@/components/IosInstallHint";
import { InstallPwaButton } from "@/components/InstallPwaButton";

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
      { url: "/icons/pwa-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/pwa-512.svg", sizes: "512x512", type: "image/svg+xml" },
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
          {/* Android: show install CTA on every route (e.g. sign-in) once beforeinstallprompt fires */}
          <InstallPwaButton className="fixed bottom-4 start-4 z-50 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
