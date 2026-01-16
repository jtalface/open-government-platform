import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import dynamic from "next/dynamic";

// Import IncidentMap with SSR disabled (Leaflet requires browser environment)
const IncidentMap = dynamic(() => import("@/components/map/SimpleIncidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-xl bg-gray-100">
      <div className="text-center">
        <div className="mb-4 text-4xl">🗺️</div>
        <p className="text-gray-600">Carregando mapa...</p>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mapa de Ocorrências</h1>
          <p className="mt-2 text-gray-600">
            Visualize e gerencie todas as ocorrências no mapa
          </p>
        </div>

        <IncidentMap showFilters />
      </div>
    </DashboardLayout>
  );
}

