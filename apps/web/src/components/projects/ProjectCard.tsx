"use client";

import Link from "next/link";
import { Card, Badge } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budgetAmount: number | null;
  budgetCurrency: string;
  fundingSource: string | null;
  assignedToName: string | null;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

const STATUS_COLORS: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  OPEN: "info",
  PLANNING: "info",
  FUNDED: "success",
  BIDDING: "warning",
  ASSIGNED: "warning",
  WORK_STARTED: "info",
  COMPLETED: "success",
};

export function ProjectCard({ project }: { project: Project }) {
  const { t } = useTranslation();

  const formatBudget = () => {
    if (!project.budgetAmount) return null;
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: project.budgetCurrency || "EUR",
    }).format(Number(project.budgetAmount));
  };

  const getStatusLabel = () => {
    const statusKey = `projects.status_${project.status.toLowerCase()}`;
    return t(statusKey);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const translateCategory = (categoryName: string): string => {
    const categoryMap: Record<string, string> = {
      "Saúde Pública": t("categories.publicHealth"),
      "Obras Públicas e Habitação": t("categories.publicWorks"),
      "Segurança Pública": t("categories.publicSafety"),
      "Eventos": t("categories.events"),
      "Infraestrutura": t("categories.infrastructure"),
      "Segurança": t("categories.safety"),
      "Limpeza": t("categories.cleaning"),
      "Trânsito": t("categories.traffic"),
      "Iluminação": t("categories.lighting"),
      "Meio Ambiente": t("categories.environment"),
    };
    
    return categoryMap[categoryName] || categoryName;
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card hover className="flex h-full flex-col p-6 transition-shadow">
        {/* Category Badge */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm"
            style={{ backgroundColor: `${project.category.color}20`, color: project.category.color }}
          >
            {project.category.icon}
          </span>
          <span className="text-sm font-medium text-gray-600">{translateCategory(project.category.name)}</span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
          {project.title}
        </h3>

        {/* Description */}
        <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-3">{project.description}</p>

        {/* Status */}
        <div className="mb-3">
          <Badge variant={STATUS_COLORS[project.status] || "default"}>
            {getStatusLabel()}
          </Badge>
        </div>

        {/* Budget */}
        {project.budgetAmount && (
          <div className="mb-2 text-sm">
            <span className="font-medium text-gray-700">{t("projects.budget")}:</span>{" "}
            <span className="text-gray-900">{formatBudget()}</span>
          </div>
        )}

        {/* Funding Source */}
        {project.fundingSource && (
          <div className="mb-2 text-sm">
            <span className="font-medium text-gray-700">{t("projects.fundingSource")}:</span>{" "}
            <span className="text-gray-600">{project.fundingSource}</span>
          </div>
        )}

        {/* Assigned To */}
        {project.assignedToName && (
          <div className="mb-2 text-sm">
            <span className="font-medium text-gray-700">{t("projects.assignedTo")}:</span>{" "}
            <span className="text-gray-600">{project.assignedToName}</span>
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500">
          {t("projects.lastUpdate")}: {formatDate(project.updatedAt)}
        </div>
      </Card>
    </Link>
  );
}

