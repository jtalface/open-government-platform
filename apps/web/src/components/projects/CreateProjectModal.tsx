"use client";

import { useState } from "react";
import { Modal, Button } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface CreateProjectModalProps {
  ticket: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ ticket, onClose, onSuccess }: CreateProjectModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: ticket.title || "",
    description: ticket.description || "",
    categoryId: ticket.categoryId || "",
    budgetAmount: "",
    budgetCurrency: "EUR",
    fundingSource: "",
    biddingReference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount) : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create project");
      }

      alert(t("projects.projectCreated"));
      onSuccess();
    } catch (error: any) {
      console.error("Error creating project:", error);
      alert(error.message || t("projects.errorCreating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t("projects.createProject")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          ℹ️ {t("tickets.linkedIncident")}: {ticket.title}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("projects.projectTitle")} *
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
            {t("projects.projectDescription")} *
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common.loading") : t("common.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

