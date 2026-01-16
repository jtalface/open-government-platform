import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ChannelsManagement } from "@/components/admin/ChannelsManagement";

export default async function AdminChannelsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Canais Oficiais</h1>
          <p className="mt-2 text-gray-600">
            Crie e gerencie canais oficiais e permissões de publicação
          </p>
        </div>

        <ChannelsManagement />
      </div>
    </AdminLayout>
  );
}

