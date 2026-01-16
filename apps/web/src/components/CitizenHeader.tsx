"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

interface CitizenHeaderProps {
  session: any;
  activeTab?: "incidents" | "map" | "channels" | "projects";
}

export function CitizenHeader({ session, activeTab }: CitizenHeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const showDashboard = session.user.role === "MANAGER" || session.user.role === "ADMIN";

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Logo role="CITIZEN" size="md" />
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/incidents"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === "incidents" || pathname === "/incidents"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                📋 {t("nav.incidentsList")}
              </Link>
              <Link
                href="/map"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === "map" || pathname === "/map"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                🗺️ {t("nav.map")}
              </Link>
              <Link
                href="/channels"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === "channels" || pathname.startsWith("/channels")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                📢 {t("nav.channels")}
              </Link>
              <Link
                href="/projects"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === "projects" || pathname.startsWith("/projects")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                🏗️ {t("nav.projects")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600">{session.user.name}</span>
            {showDashboard && (
              <Link
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t("nav.dashboard")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

