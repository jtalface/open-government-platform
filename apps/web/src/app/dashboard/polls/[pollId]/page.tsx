import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PollResults } from "@/components/polls/PollResults";

export default async function PollResultsPage({
  params,
}: {
  params: { pollId: string };
}) {
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
      <PollResults pollId={params.pollId} />
    </DashboardLayout>
  );
}

