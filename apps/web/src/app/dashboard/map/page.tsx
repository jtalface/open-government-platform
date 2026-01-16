import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import dynamic from "next/dynamic";

// Import IncidentMap with SSR disabled (Leaflet requires browser environment)
const IncidentMap = dynamic(() => import("@/components/map/SimpleIncidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-xl bg-gray-100">
      <div className="text-center">
        <div className="mb-4 text-4xl">🗺️</div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default async function ManagerMapPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  try {
    requireManager(session);
  } catch {
    redirect("/unauthorized");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader titleKey="map.title" descriptionKey="map.description" />

        <IncidentMap showFilters />
      </div>
    </DashboardLayout>
  );
}

