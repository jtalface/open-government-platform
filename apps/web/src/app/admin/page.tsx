import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStats } from "@/components/admin/AdminStats";

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administração</h1>
          <p className="mt-2 text-gray-600">
            Gestão do sistema e configurações globais
          </p>
        </div>

        <AdminStats />
      </div>
    </AdminLayout>
  );
}

