"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner, Badge } from "@ogp/ui";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/TranslationContext";

// Beira City Bounding Box
const BEIRA_BOUNDS = {
  minLat: -19.88,  // South
  maxLat: -19.66,  // North
  minLng: 34.78,   // West
  maxLng: 34.91,   // East
  center: {
    lat: -19.83,
    lng: 34.845,
  },
};

interface SimpleIncidentMapProps {
  categoryId?: string;
  status?: string;
  showFilters?: boolean;
}

export default function SimpleIncidentMap({
  categoryId,
  status,
  showFilters = true,
}: SimpleIncidentMapProps) {
  const { t, locale } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || "");
  const [selectedStatus, setSelectedStatus] = useState<string>(status || "");
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const dateLocale = locale === "en" ? enUS : ptBR;

  // Fetch incidents
  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ["incidents-map", selectedCategory, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (selectedStatus) params.set("status", selectedStatus);

      const response = await fetch(`/api/incidents?${params}`);
      if (!response.ok) throw new Error("Failed to fetch incidents");
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      return data.data;
    },
  });

  const incidents = incidentsData?.data?.items || [];

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadLeaflet = async () => {
      // Load CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Load Leaflet
      if (!(window as any).L) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          setMapLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setMapLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Create map
    // Beira, Mozambique - center on the city but allow panning outside
    const map = L.map(mapRef.current, {
      center: [BEIRA_BOUNDS.center.lat, BEIRA_BOUNDS.center.lng],
      zoom: 13,
      minZoom: 3,
      maxZoom: 18,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Fit map to Beira bounds initially
    map.fitBounds([
      [BEIRA_BOUNDS.minLat, BEIRA_BOUNDS.minLng],
      [BEIRA_BOUNDS.maxLat, BEIRA_BOUNDS.maxLng],
    ]);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || incidentsLoading) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (incidents.length === 0) return;

    // Calculate bounds
    const bounds: any[] = [];

    // Add markers
    incidents.forEach((incident: any) => {
      // Skip incidents without coordinates
      if (!incident.lat || !incident.lng) {
        return;
      }
      const statusColors: Record<string, string> = {
        OPEN: "#ef4444",
        TRIAGED: "#f59e0b",
        TICKETED: "#3b82f6",
        RESOLVED: "#10b981",
        CLOSED: "#6b7280",
      };

      const color = statusColors[incident.status] || "#3b82f6";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              color: white;
              font-size: 16px;
              transform: rotate(45deg);
            ">📍</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([incident.lat, incident.lng], { icon }).addTo(
        mapInstanceRef.current
      );

      const dateFnsLocale = locale === "pt" ? ptBR : enUS;
      const translatedCategory = translateCategory(incident.category?.name || "", t);

      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <div style="margin-bottom: 8px;">
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
              ${getStatusLabel(incident.status, t)}
            </span>
            <span style="color: #666; font-size: 12px; margin-left: 8px;">
              ${translatedCategory || t("common.noCategory")}
            </span>
          </div>
          <h3 style="margin: 8px 0; font-weight: 600; color: #111;">
            ${incident.title}
          </h3>
          <p style="margin: 8px 0; font-size: 14px; color: #666;">
            ${incident.description.substring(0, 100)}${incident.description.length > 100 ? "..." : ""}
          </p>
          <div style="margin: 8px 0; font-size: 12px; color: #666;">
            ${incident.neighborhood ? `<p>📍 ${incident.neighborhood.name}</p>` : ""}
            <p>👤 ${incident.createdBy?.name || t("common.anonymous")}</p>
            <p>👍 ${incident.voteStats?.upvotes || 0} ${t("common.votes")}</p>
            <p>🕒 ${formatDistanceToNow(new Date(incident.createdAt), {
              addSuffix: true,
              locale: dateFnsLocale,
            })}</p>
          </div>
          <a href="/incidents/${incident.id}" style="
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            margin-top: 8px;
          ">
            ${t("common.viewDetails")} →
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      markersRef.current.push(marker);
      bounds.push([incident.lat, incident.lng]);
    });

    // Fit bounds if we have incidents
    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [incidents, mapLoaded, incidentsLoading]);

  // Calculate status counts
  const statusCounts: Record<string, number> = {};
  incidents.forEach((inc: any) => {
    statusCounts[inc.status] = (statusCounts[inc.status] || 0) + 1;
  });

  const isLoading = incidentsLoading || !mapLoaded;

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("incidents.allCategories")}</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="OPEN">Aberto</option>
                <option value="TRIAGED">Triado</option>
                <option value="TICKETED">Em Resolução</option>
                <option value="RESOLVED">Resolvido</option>
                <option value="CLOSED">Fechado</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <strong>{incidents.length}</strong> {t("incidents.found")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <span className="text-sm font-medium text-gray-700">Legenda:</span>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-1">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getStatusColor(status) }}
              />
              <span className="text-xs text-gray-600">
                {getStatusLabel(status, t)}: {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={mapRef}
          className="h-[600px] w-full rounded-xl"
          style={{ zIndex: 1 }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* No Incidents Overlay */}
        {!isLoading && incidents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-900 bg-opacity-50">
            <div className="rounded-xl bg-white p-6 text-center shadow-lg">
              <p className="text-gray-600">
                {t("map.noIncidents")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "#ef4444",
    TRIAGED: "#f59e0b",
    TICKETED: "#3b82f6",
    RESOLVED: "#10b981",
    CLOSED: "#6b7280",
  };
  return colors[status] || "#3b82f6";
}

function getStatusLabel(status: string, t: (key: string) => string): string {
  const labels: Record<string, string> = {
    OPEN: t("incidents.status_open"),
    TRIAGED: t("incidents.status_triaged"),
    TICKETED: t("incidents.status_ticketed"),
    RESOLVED: t("incidents.status_resolved"),
    CLOSED: t("incidents.status_closed"),
  };
  return labels[status] || status;
}

function translateCategory(categoryName: string, t: (key: string) => string): string {
  const categoryMap: Record<string, string> = {
    "Saúde Pública": t("categories.publicHealth"),
    "Obras Públicas e Habitação": t("categories.publicWorks"),
    "Segurança Pública": t("categories.publicSafety"),
    "Eventos": t("categories.events"),
    "Infraestrutura": t("categories.infrastructure"),
    "Segurança": t("categories.safety"),
    "Limpeza": t("categories.cleaning"),
    "Trânsito": t("categories.traffic"),
    "Iluminação": t("categories.lighting"),
    "Meio Ambiente": t("categories.environment"),
  };
  
  return categoryMap[categoryName] || categoryName;
}

