import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";
import { CitizenHeader } from "@/components/CitizenHeader";

export default async function NewIncidentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader session={session} activeTab="incidents" />

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Criar Nova Ocorrência</h1>
          <p className="mt-1 text-gray-600">
            Reporte um problema na sua vizinhança
          </p>
        </div>

        <CreateIncidentForm />
      </main>
    </div>
  );
}
