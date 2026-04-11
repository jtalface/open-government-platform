"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { LoadingSpinner, Button } from "@ogp/ui";
import { ProjectCard } from "./ProjectCard";
import { CreateStandaloneProjectModal } from "./CreateStandaloneProjectModal";
import { ProjectsCategoryFilter } from "./ProjectsCategoryFilter";
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
  hasImages?: boolean;
  hasUpdates?: boolean;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

type TabType = "ongoing" | "completed" | "archived";

export function ProjectsList() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("ongoing");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isManager =
    session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["projects", activeTab, selectedCategoryId],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (activeTab === "completed") {
        params.append("status", "COMPLETED");
        params.append("archived", "false");
      } else if (activeTab === "archived") {
        params.append("archived", "true");
      } else {
        // Ongoing: not completed and not archived
        params.append("archived", "false");
      }

      if (selectedCategoryId) {
        params.append("categoryId", selectedCategoryId);
      }

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      return data.data.items;
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-red-600">{t("projects.errorLoading")}</p>
      </div>
    );
  }

  const projects: Project[] = data || [];

  const tabs: { key: TabType; label: string }[] = [
    { key: "ongoing", label: t("projects.ongoing") },
    { key: "completed", label: t("projects.completed") },
    { key: "archived", label: t("projects.archived") },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Filters and Create Button */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="border-b border-gray-200 flex-1">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {isManager && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="ml-6">
              {t("projects.createProject")}
            </Button>
          )}
        </div>

        {/* Vereação Filter */}
        <ProjectsCategoryFilter
          selectedCategoryId={selectedCategoryId}
          onChangeCategory={setSelectedCategoryId}
        />
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-xl bg-gray-100 p-12 text-center">
          <p className="text-gray-600">
            {activeTab === "ongoing" && t("projects.noOngoingProjects")}
            {activeTab === "completed" && t("projects.noCompletedProjects")}
            {activeTab === "archived" && t("projects.noArchivedProjects")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <CreateStandaloneProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            refetch();
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

