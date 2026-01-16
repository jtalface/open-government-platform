"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@ogp/ui";

// Import SimpleIncidentMap with SSR disabled (Leaflet requires browser environment)
const SimpleIncidentMap = dynamic(
  () => import("@/components/map/SimpleIncidentMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-xl bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    ),
  }
);

/**
 * Dashboard incident map component
 * Shows all incidents on an interactive map with filters
 */
export function IncidentMap() {
  return (
    <div className="h-[500px] w-full">
      <SimpleIncidentMap showFilters={false} />
    </div>
  );
}
