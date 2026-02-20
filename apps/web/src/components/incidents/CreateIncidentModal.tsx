"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@ogp/ui";
import { useQuery, useMutation } from "@tanstack/react-query";

// Beira City Bounding Box
const BEIRA_BOUNDS = {
  minLat: -19.88,  // South
  maxLat: -19.66,  // North
  minLng: 34.78,   // West
  maxLng: 34.91,   // East
};

// Default location - center of Beira
const DEFAULT_LOCATION = { lat: -19.83, lng: 34.845 };

// Check if coordinates are within Beira bounds
function isWithinBeiraBounds(lat: number, lng: number): boolean {
  return (
    lat >= BEIRA_BOUNDS.minLat &&
    lat <= BEIRA_BOUNDS.maxLat &&
    lng >= BEIRA_BOUNDS.minLng &&
    lng <= BEIRA_BOUNDS.maxLng
  );
}

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateIncidentModal({ isOpen, onClose }: CreateIncidentModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return data.data;
    },
  });

  // Get user location
  useEffect(() => {
    if (isOpen && !location) {
      if ("geolocation" in navigator) {
        const timeoutId = setTimeout(() => {
          if (!location) {
            setLocationError("Tempo esgotado. Usando localização padrão.");
            setLocation(DEFAULT_LOCATION);
          }
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Check if location is within Beira bounds
            if (isWithinBeiraBounds(userLat, userLng)) {
              setLocation({ lat: userLat, lng: userLng });
              setLocationError("");
            } else {
              // User is outside Beira - use default location
              setLocation(DEFAULT_LOCATION);
              setLocationError("Fora dos limites de Beira. Usando padrão.");
            }
          },
          (error) => {
            clearTimeout(timeoutId);
            setLocationError("Usando localização padrão (Beira)");
            setLocation(DEFAULT_LOCATION);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
          }
        );

        return () => clearTimeout(timeoutId);
      } else {
        setLocation(DEFAULT_LOCATION);
        setLocationError("Geolocalização não suportada. Usando padrão.");
      }
    }
  }, [isOpen, location]);

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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload image first if selected
      let imageUrl = uploadedImageUrl;
      if (selectedImage && !imageUrl) {
        imageUrl = await uploadImage();
        if (!imageUrl && selectedImage) {
          throw new Error("Falha ao fazer upload da imagem");
        }
      }

      const incidentData = {
        ...data,
        media: imageUrl
          ? [
              {
                url: imageUrl,
                type: "IMAGE",
              },
            ]
          : undefined,
      };

      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incidentData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Falha ao criar ocorrência");
      }
      return res.json();
    },
    onSuccess: () => {
      onClose();
      router.refresh();
      // Reset form
      setTitle("");
      setDescription("");
      setCategoryId("");
      setSelectedImage(null);
      setImagePreview(null);
      setUploadedImageUrl(null);
      setImageUploadError("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      setLocationError("Localização necessária");
      return;
    }

    createMutation.mutate({
      title,
      description,
      categoryId,
      location,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Reportar Ocorrência</h2>
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
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma categoria</option>
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
                  {selectedImage ? "Alterar Foto" : "Selecionar Foto"}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                {selectedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setUploadedImageUrl(null);
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

          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Localização</span>
              {location ? (
                <span className="text-xs text-green-600">✓ Obtida</span>
              ) : (
                <span className="text-xs text-gray-500">Obtendo...</span>
              )}
            </div>
            {locationError && <p className="mt-1 text-xs text-red-600">{locationError}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={createMutation.isPending || isUploading}
              disabled={!location || createMutation.isPending || isUploading}
            >
              {isUploading ? "A fazer upload..." : "Reportar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

