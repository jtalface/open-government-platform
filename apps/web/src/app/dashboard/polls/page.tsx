import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PollsList } from "@/components/polls/PollsList";
import { PageHeader } from "@/components/PageHeader";

export default async function PollsManagementPage() {
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
      <PageHeader titleKey="polls.managePolls" descriptionKey="polls.managePollsDescription" />
      <PollsList municipalityId={session.user.municipalityId} />
    </DashboardLayout>
  );
}

