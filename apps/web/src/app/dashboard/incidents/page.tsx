import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ManagerIncidentList } from "@/components/dashboard/ManagerIncidentList";
import { ManagerIncidentFilters } from "@/components/dashboard/ManagerIncidentFilters";
import { PageHeader } from "@/components/PageHeader";

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
        <PageHeader 
          titleKey="dashboard.manageIncidents" 
          descriptionKey="dashboard.manageIncidentsDescription" 
        />

        <ManagerIncidentFilters />
        <ManagerIncidentList />
      </div>
    </DashboardLayout>
  );
}

