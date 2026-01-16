import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { IncidentDetail } from "@/components/incidents/IncidentDetail";

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <IncidentDetail incidentId={params.id} />
    </div>
  );
}

