import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStats } from "@/components/admin/AdminStats";
import { PageHeader } from "@/components/PageHeader";

// This page relies on authenticated, per-request data (getServerSession),
// so mark it as dynamic to avoid static generation errors.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  try {
    requireAdmin(session);
  } catch {
    redirect("/unauthorized");
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader titleKey="admin.title" descriptionKey="admin.overview" />

        <AdminStats />
      </div>
    </AdminLayout>
  );
}

