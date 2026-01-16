import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { IncidentMap } from "@/components/dashboard/IncidentMap";
import { PageHeader } from "@/components/PageHeader";
import { DashboardMapSection } from "@/components/dashboard/DashboardMapSection";

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
        <PageHeader titleKey="dashboard.title" descriptionKey="dashboard.overview" />

        <DashboardStats />

        <DashboardMapSection />
      </div>
    </DashboardLayout>
  );
}

