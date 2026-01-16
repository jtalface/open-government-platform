"use client";

import { useState } from "react";
import { Modal, Button } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface EditProjectModalProps {
  project: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title || "",
    description: project.description || "",
    budgetAmount: project.budgetAmount || "",
    budgetCurrency: project.budgetCurrency || "EUR",
    fundingSource: project.fundingSource || "",
    biddingReference: project.biddingReference || "",
    assignedToName: project.assignedToName || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount as any) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update project");

      onSuccess();
    } catch (error) {
      console.error("Error updating project:", error);
      alert(t("projects.errorUpdating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t("projects.editProject")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("projects.projectTitle")}
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("projects.projectDescription")}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("projects.budget")}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.budgetAmount}
              onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("projects.budgetCurrency")}
            </label>
            <input
              type="text"
              value={formData.budgetCurrency}
              onChange={(e) => setFormData({ ...formData, budgetCurrency: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("projects.fundingSource")}
          </label>
          <input
            type="text"
            value={formData.fundingSource}
            onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("projects.biddingReference")}
          </label>
          <input
            type="text"
            value={formData.biddingReference}
            onChange={(e) => setFormData({ ...formData, biddingReference: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("projects.contractor")}
          </label>
          <input
            type="text"
            value={formData.assignedToName}
            onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

