"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@ogp/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { normalizeIncidentMediaUrl } from "@/lib/media";

interface EditIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  /** When true, show soft-delete control (admin only). */
  isAdmin?: boolean;
  initialData: {
    title: string;
    description: string;
    categoryId: string;
    media?: any;
  };
}

export function EditIncidentModal({
  isOpen,
  onClose,
  incidentId,
  isAdmin = false,
  initialData,
}: EditIncidentModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [categoryId, setCategoryId] = useState(initialData.categoryId);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Parse existing media
  useEffect(() => {
    if (initialData.media) {
      let mediaArray: any[] = [];
      if (typeof initialData.media === "string") {
        try {
          mediaArray = JSON.parse(initialData.media);
        } catch {
          mediaArray = [];
        }
      } else if (Array.isArray(initialData.media)) {
        mediaArray = initialData.media;
      }
      const firstImage = mediaArray.find((m: any) => m.type === "IMAGE");
      if (firstImage) {
        const normalized = normalizeIncidentMediaUrl(firstImage.url);
        setCurrentImageUrl(normalized);
        setImagePreview(normalized);
      }
    }
  }, [initialData.media]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategoryId(initialData.categoryId);
      setSelectedImage(null);
      setImageUploadError("");
      setUploadedImageUrl(null);
      setIsUploading(false);
      setImageRemoved(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialData]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return data.data;
    },
  });

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setImageUploadError("Apenas imagens são permitidas (JPG, PNG, WEBP, GIF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError("A imagem é muito grande. Tamanho máximo: 5MB");
      return;
    }

    setSelectedImage(file);
    setImageUploadError("");
    setImageRemoved(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image
  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setIsUploading(true);
    setImageUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const res = await fetch("/api/incidents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Erro ao fazer upload da imagem");
      }

      const data = await res.json();
      return data.data.url;
    } catch (error: any) {
      setImageUploadError(error.message || "Erro ao fazer upload da imagem");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload image first if a new one was selected
      let imageUrl = uploadedImageUrl;
      if (selectedImage && !imageUrl) {
        imageUrl = await uploadImage();
        if (!imageUrl && selectedImage) {
          throw new Error("Falha ao fazer upload da imagem");
        }
      }

      const updateData: any = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
      };

      // Handle image updates:
      // - If new image uploaded, use it
      // - If image was explicitly removed, set empty array
      // - If existing image should be kept, don't include media in update
      if (imageUrl) {
        // New image uploaded
        updateData.media = [{ url: imageUrl, type: "IMAGE" }];
      } else if (imageRemoved) {
        // Image was explicitly removed by user
        updateData.media = [];
      }
      // If neither condition is met, don't include media in update (keeps existing image)

      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Falha ao atualizar ocorrência");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "incidents", "deleted"] });
      onClose();
      router.refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/incidents/${incidentId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error?.message || "Falha ao remover ocorrência");
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident-comments", incidentId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "incidents", "deleted"] });
      onClose();
      router.push("/incidents");
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      title,
      description,
      categoryId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Editar Ocorrência</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Vereação <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma vereação</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            maxLength={200}
            placeholder="Descreva brevemente o problema"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              placeholder="Descreva o problema em detalhes"
              className="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Foto (Opcional)
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {selectedImage || currentImageUrl ? "Alterar Foto" : "Adicionar Foto"}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                {(selectedImage || currentImageUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setUploadedImageUrl(null);
                      setCurrentImageUrl(null);
                      setImageRemoved(true);
                      setImageUploadError("");
                    }}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    Remover
                  </button>
                )}
              </div>

              {imagePreview && (
                <div className="relative rounded-lg border border-gray-200 overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {imageUploadError && (
                <p className="text-sm text-red-600">{imageUploadError}</p>
              )}

              <p className="text-xs text-gray-500">
                Formatos aceites: JPG, PNG, WEBP, GIF. Tamanho máximo: 5MB
              </p>
            </div>
          </div>

          {/* Location info (read-only) */}
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Localização</span>
              <span className="text-xs text-gray-500">Não pode ser alterada</span>
            </div>
          </div>

          {updateMutation.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {updateMutation.error?.message || "Erro ao atualizar ocorrência. Tente novamente."}
            </div>
          )}

          {isAdmin && (
            <div className="rounded-lg border border-red-200 bg-red-50/80 p-4">
              <p className="text-sm font-medium text-red-900">Zona de perigo</p>
              <p className="mt-1 text-xs text-red-800/90">
                Remove a ocorrência das listagens e mapas públicos. Os dados mantêm-se na base de dados; pode
                rever em Admin → Ocorrências removidas.
              </p>
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Remover ocorrência…
                </Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-red-900">
                    Tem a certeza? A ocorrência deixa de aparecer em listas e mapas para todos, exceto
                    administradores na página de Ocorrências removidas.
                  </p>
                  {deleteMutation.isError && (
                    <p className="text-sm text-red-700">
                      {(deleteMutation.error as Error)?.message}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      isLoading={deleteMutation.isPending}
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate()}
                    >
                      Confirmar remoção
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={updateMutation.isPending || isUploading}
              disabled={updateMutation.isPending || isUploading}
            >
              {isUploading ? "A fazer upload..." : "Guardar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
