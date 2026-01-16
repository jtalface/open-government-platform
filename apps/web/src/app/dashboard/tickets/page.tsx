import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TicketList } from "@/components/tickets/TicketList";

export default async function TicketsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
            <p className="mt-2 text-gray-600">Gerenciar tickets de atendimento</p>
          </div>

          <div className="text-sm text-gray-500">
            TODO: Botão para criar ticket
          </div>
        </div>

        <TicketList />
      </div>
    </DashboardLayout>
  );
}

