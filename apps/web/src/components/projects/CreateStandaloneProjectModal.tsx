"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal, Button } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { ProjectImagePicker } from "./ProjectImagePicker";

interface CreateStandaloneProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function CreateStandaloneProjectModal({ isOpen, onClose, onSuccess }: CreateStandaloneProjectModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    budgetAmount: "",
    budgetCurrency: "MZN",
    fundingSource: "",
    biddingReference: "",
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return data.data || [];
    },
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount) : undefined,
          descriptionMedia: imageUrls.length ? imageUrls.map((url) => ({ url })) : undefined,
        }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to create project";
        const contentType = res.headers.get("content-type");
        try {
          if (contentType?.includes("application/json")) {
            const error = await res.json();
            errorMessage = error.message || error.error?.message || errorMessage;
          } else {
            const text = await res.text();
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          // If parsing fails, use default message
          errorMessage = `Error ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      alert(t("projects.projectCreated"));
      // Reset form
      setFormData({
        title: "",
        description: "",
        categoryId: "",
        budgetAmount: "",
        budgetCurrency: "MZN",
        fundingSource: "",
        biddingReference: "",
      });
      setImageUrls([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating project:", error);
      alert(error.message || t("projects.errorCreating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("projects.createProject")}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            {t("projects.category")} *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          >
            <option value="">{t("common.selectCategory")}</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
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

        <ProjectImagePicker urls={imageUrls} onChange={setImageUrls} disabled={isSubmitting} />

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
            <select
              value={formData.budgetCurrency}
              onChange={(e) => setFormData({ ...formData, budgetCurrency: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="MZN">MZN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
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
