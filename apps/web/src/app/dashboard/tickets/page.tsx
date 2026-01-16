import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TicketList } from "@/components/tickets/TicketList";
import { PageHeader } from "@/components/PageHeader";

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
        <PageHeader titleKey="tickets.title" descriptionKey="tickets.title" />

        <TicketList />
      </div>
    </DashboardLayout>
  );
}

