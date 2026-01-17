"use client";

import { useState } from "react";
import { Modal, Button, LoadingSpinner } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface CreatePollModalProps {
  municipalityId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePollModal({ municipalityId, onClose, onSuccess }: CreatePollModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    optionA: "",
    optionB: "",
    status: "DRAFT" as "DRAFT" | "ACTIVE",
    startsAt: "",
    endsAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/municipalities/${municipalityId}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          optionA: formData.optionA,
          optionB: formData.optionB,
          status: formData.status,
          startsAt: formData.startsAt || undefined,
          endsAt: formData.endsAt || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || t("polls.errorCreating"));
      }

      // Success - close modal and refresh
      onSuccess();
    } catch (error: any) {
      console.error("Error creating poll:", error);
      alert(error.message || t("polls.errorCreating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t("polls.createPoll")} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          ℹ️ {t("polls.singleActivePollInfo")}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("polls.pollQuestion")} *
          </label>
          <textarea
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={3}
            placeholder={t("polls.questionPlaceholder")}
            required
            minLength={10}
          />
          <p className="mt-1 text-xs text-gray-500">{t("polls.minCharacters", { count: 10 })}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("polls.optionA")} *
            </label>
            <input
              type="text"
              value={formData.optionA}
              onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={t("polls.optionPlaceholder")}
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("polls.optionB")} *
            </label>
            <input
              type="text"
              value={formData.optionB}
              onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={t("polls.optionPlaceholder")}
              required
              minLength={2}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("polls.status")} *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "DRAFT" | "ACTIVE" })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="DRAFT">{t("polls.statusDraft")}</option>
            <option value="ACTIVE">{t("polls.statusActive")}</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {formData.status === "ACTIVE" && t("polls.activeWillCloseOthers")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("polls.startsAt")} ({t("common.optional")})
            </label>
            <input
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("polls.endsAt")} ({t("common.optional")})
            </label>
            <input
              type="datetime-local"
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner size="sm" /> : t("common.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

