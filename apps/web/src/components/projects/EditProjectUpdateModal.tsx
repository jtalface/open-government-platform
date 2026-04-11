"use client";

import { useState } from "react";
import { Modal, Button } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { ProjectImagePicker } from "./ProjectImagePicker";
import { parseStoredImageUrls } from "@/lib/projects/media";

export interface ProjectUpdateEditShape {
  id: string;
  message: string;
  visibility: string;
  attachments: unknown;
}

interface EditProjectUpdateModalProps {
  projectId: string;
  update: ProjectUpdateEditShape;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProjectUpdateModal({
  projectId,
  update,
  onClose,
  onSuccess,
}: EditProjectUpdateModalProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState(update.message);
  const [visibility, setVisibility] = useState<"PUBLIC" | "INTERNAL">(
    update.visibility === "INTERNAL" ? "INTERNAL" : "PUBLIC"
  );
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    parseStoredImageUrls(update.attachments)
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const attachments = imageUrls.map((url) => ({ url }));
      const res = await fetch(`/api/projects/${projectId}/updates/${update.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          visibility,
          attachments,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          (typeof err.error === "object" && err.error?.message) ||
          (typeof err.error === "string" && err.error) ||
          err.message;
        throw new Error(msg || "Failed");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : t("projects.errorUpdatingUpdate"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t("projects.editUpdate")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("projects.updateMessage")} *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={5}
            required
            minLength={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t("projects.updateVisibility")}</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "INTERNAL")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="PUBLIC">{t("projects.publicUpdate")}</option>
            <option value="INTERNAL">{t("projects.internalUpdate")}</option>
          </select>
        </div>

        <ProjectImagePicker urls={imageUrls} onChange={setImageUrls} disabled={submitting} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
