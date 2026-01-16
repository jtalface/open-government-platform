"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface CitizenHeaderProps {
  userName: string;
  showDashboard?: boolean;
  showCreateButton?: boolean;
}

export function CitizenHeader({ userName, showDashboard, showCreateButton }: CitizenHeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              OGP
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/incidents"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === "/incidents"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                📋 {t("incidents.list")}
              </Link>
              <Link
                href="/map"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === "/map"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                🗺️ {t("incidents.map")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {showCreateButton && (
              <Link
                href="/incidents/new"
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                + {t("incidents.create")}
              </Link>
            )}
            <span className="text-sm text-gray-600">{userName}</span>
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

