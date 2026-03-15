"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { IncidentMap } from "./IncidentMap";

export function DashboardMapSection() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || undefined;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{t("dashboard.incidentMap")}</h2>
        <Link
          href="/dashboard/map"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          {t("dashboard.viewFullMap")} →
        </Link>
      </div>
      <IncidentMap categoryId={categoryId} />
    </div>
  );
}

