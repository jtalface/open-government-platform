"use client";

import { useState } from "react";
import { Modal, Button } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface ChangeStatusModalProps {
  project: any;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  "OPEN",
  "PLANNING",
  "FUNDED",
  "BIDDING",
  "ASSIGNED",
  "WORK_STARTED",
  "COMPLETED",
];

export function ChangeStatusModal({ project, onClose, onSuccess }: ChangeStatusModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState(project.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to change status");
      }

      alert(t("projects.statusChanged"));
      onSuccess();
    } catch (error: any) {
      console.error("Error changing status:", error);
      alert(error.message || t("projects.errorUpdating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKey = `projects.status_${status.toLowerCase()}`;
    return t(statusKey);
  };

  return (
    <Modal isOpen onClose={onClose} title={t("projects.changeStatus")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("projects.status")}
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {/* Validation hints */}
        {newStatus === "FUNDED" && !project.fundingSource && (
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            ⚠️ {t("projects.fundingSource")} is required for FUNDED status
          </div>
        )}

        {newStatus === "ASSIGNED" && !project.assignedToName && (
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            ⚠️ {t("projects.contractor")} is required for ASSIGNED status
          </div>
        )}

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

