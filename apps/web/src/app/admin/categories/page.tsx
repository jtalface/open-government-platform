import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CategoryManagement } from "@/components/admin/CategoryManagement";

export default async function AdminCategoriesPage() {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Categorias</h1>
            <p className="mt-2 text-gray-600">
              Gerir categorias de ocorrências e tickets
            </p>
          </div>
        </div>

        <CategoryManagement />
      </div>
    </AdminLayout>
  );
}

