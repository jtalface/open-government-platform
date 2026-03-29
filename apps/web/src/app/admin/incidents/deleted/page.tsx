import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DeletedIncidentsList } from "@/components/admin/DeletedIncidentsList";

export default async function AdminDeletedIncidentsPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Ocorrências removidas</h1>
          <p className="mt-1 text-gray-600">
            Lista de ocorrências retiradas da vista pública (os registos mantêm-se na base de dados). Pode
            abrir cada uma para rever detalhes ou editar como administrador.
          </p>
        </div>
        <DeletedIncidentsList />
      </div>
    </AdminLayout>
  );
}
