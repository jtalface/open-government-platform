import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { PageHeader } from "@/components/PageHeader";

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
        <PageHeader 
          titleKey="admin.manageCategories" 
          descriptionKey="admin.manageCategoriesDescription" 
        />

        <CategoryManagement />
      </div>
    </AdminLayout>
  );
}

