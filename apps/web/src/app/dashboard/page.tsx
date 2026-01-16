import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { IncidentMap } from "@/components/dashboard/IncidentMap";

export default async function DashboardPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Visão geral das ocorrências e tickets</p>
        </div>

        <DashboardStats />

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Mapa de Ocorrências</h2>
            <a
              href="/dashboard/map"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Ver mapa completo →
            </a>
          </div>
          <IncidentMap />
        </div>
      </div>
    </DashboardLayout>
  );
}

