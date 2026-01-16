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

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader session={session} activeTab="incidents" />

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
          </div>
          <a
            href="/incidents/new"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + Criar Ocorrência
          </a>
        </div>
        <IncidentFilters />
        <IncidentList />
      </main>
    </div>
  );
}
