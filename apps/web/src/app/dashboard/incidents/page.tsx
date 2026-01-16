import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ManagerIncidentList } from "@/components/dashboard/ManagerIncidentList";
import { ManagerIncidentFilters } from "@/components/dashboard/ManagerIncidentFilters";

export default async function ManagerIncidentsPage() {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Ocorrências</h1>
            <p className="mt-2 text-gray-600">
              Visualize e faça a triagem de todas as ocorrências reportadas
            </p>
          </div>
        </div>

        <ManagerIncidentFilters />
        <ManagerIncidentList />
      </div>
    </DashboardLayout>
  );
}

