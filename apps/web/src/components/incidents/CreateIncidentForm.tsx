"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@ogp/ui";
import { useQuery, useMutation } from "@tanstack/react-query";

// Beira City Bounding Box
const BEIRA_BOUNDS = {
  minLat: -19.88,  // South
  maxLat: -19.66,  // North
  minLng: 34.78,   // West
  maxLng: 34.91,   // East
};

// Default location - Conselho Municipal da Beira, Mozambique coordinates
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

export function CreateIncidentForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locationStatus, setLocationStatus] = useState<"loading" | "success" | "error" | "manual">("loading");
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
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocalização não suportada pelo navegador.");
      setLocationStatus("error");
      return;
    }

    const timeoutId = setTimeout(() => {
      if (locationStatus === "loading") {
        setLocationError("Tempo esgotado. Usando localização padrão (Beira).");
        setLocation(DEFAULT_LOCATION);
        setLocationStatus("manual");
      }
    }, 10000); // 10 second timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Check if location is within Beira bounds
        if (isWithinBeiraBounds(userLat, userLng)) {
          setLocation({ lat: userLat, lng: userLng });
          setLocationError("");
          setLocationStatus("success");
        } else {
          // User is outside Beira - use default location
          setLocation(DEFAULT_LOCATION);
          setLocationError("Localização fora dos limites da cidade de Beira. Usando localização padrão.");
          setLocationStatus("manual");
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        let errorMessage = "Erro ao obter localização.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permissão de localização negada.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Localização indisponível.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo esgotado ao obter localização.";
            break;
        }
        
        setLocationError(`${errorMessage} Usando localização padrão (Beira).`);
        setLocation(DEFAULT_LOCATION);
        setLocationStatus("manual");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );

    return () => clearTimeout(timeoutId);
  }, []);

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
    onSuccess: (data) => {
      router.push(`/incidents/${data.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      setLocationError("Localização necessária para criar ocorrência");
      return;
    }

    createMutation.mutate({
      title,
      description,
      categoryId,
      location,
    });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
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

        {/* Title */}
        <Input
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={5}
          maxLength={200}
          placeholder="Descreva brevemente o problema"
        />

        {/* Description */}
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
            rows={5}
            placeholder="Descreva o problema em detalhes. Quanto mais informações, melhor!"
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
                  className="w-full h-64 object-cover"
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

        {/* Location */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Localização</span>
              <p className="text-xs text-gray-500">
                A ocorrência será associada à sua localização
              </p>
            </div>
            {locationStatus === "loading" && (
              <span className="text-sm text-gray-500">📍 Obtendo localização...</span>
            )}
            {locationStatus === "success" && location && (
              <div className="text-right">
                <span className="text-sm font-medium text-green-600">✓ Localização obtida</span>
                <p className="text-xs text-gray-500">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            )}
            {locationStatus === "manual" && location && (
              <div className="text-right">
                <span className="text-sm font-medium text-amber-600">⚠️ Localização padrão</span>
                <p className="text-xs text-gray-500">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            )}
            {locationStatus === "error" && (
              <span className="text-sm text-red-600">✗ Erro</span>
            )}
          </div>
          {locationError && (
            <p className="mt-2 text-sm text-amber-700">{locationError}</p>
          )}
          
          {/* Manual location button */}
          {!location && locationStatus === "error" && (
            <button
              type="button"
              onClick={() => {
                setLocation(DEFAULT_LOCATION);
                setLocationStatus("manual");
                setLocationError("Usando localização padrão (Beira).");
              }}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Usar localização padrão (Beira)
            </button>
          )}
        </div>

        {/* Error message */}
        {createMutation.isError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {createMutation.error?.message || "Erro ao criar ocorrência. Tente novamente."}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={createMutation.isPending || isUploading}
            disabled={!location || createMutation.isPending || isUploading}
          >
            {isUploading ? "A fazer upload..." : "Criar Ocorrência"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
