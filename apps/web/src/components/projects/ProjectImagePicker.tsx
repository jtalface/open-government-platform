"use client";

import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { MAX_PROJECT_IMAGES } from "@/lib/projects/media";

interface ProjectImagePickerProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

export function ProjectImagePicker({ urls, onChange, disabled }: ProjectImagePickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;

    if (urls.length >= MAX_PROJECT_IMAGES) {
      setError(t("projects.maxImagesReached"));
      return;
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError(t("projects.imageTypeError"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("projects.imageSizeError"));
      return;
    }

    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/projects/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }
      onChange([...urls, data.data.url as string]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("projects.imageUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t("projects.projectImages")}{" "}
        <span className="font-normal text-gray-500">
          ({urls.length}/{MAX_PROJECT_IMAGES})
        </span>
      </label>
      <p className="text-xs text-gray-500">{t("projects.projectImagesHint")}</p>

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={`${url}-${i}`} className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < MAX_PROJECT_IMAGES && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={disabled || uploading}
            onChange={handleFile}
          />
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
          >
            {uploading ? t("common.loading") : t("projects.addImage")}
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
