import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { IncidentList } from "@/components/incidents/IncidentList";
import { IncidentFilters } from "@/components/incidents/IncidentFilters";
import { CitizenHeader } from "@/components/CitizenHeader";

export default async function IncidentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const showDashboard = session.user.role === "MANAGER" || session.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader 
        userName={session.user.name || ""} 
        showDashboard={showDashboard}
        showCreateButton={true}
      />

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <IncidentFilters />
        <IncidentList />
      </main>
    </div>
  );
}
