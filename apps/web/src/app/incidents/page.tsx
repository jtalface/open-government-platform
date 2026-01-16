import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { IncidentList } from "@/components/incidents/IncidentList";
import { IncidentFilters } from "@/components/incidents/IncidentFilters";
import { CreateIncidentButton } from "@/components/incidents/CreateIncidentButton";
import Link from "next/link";

export default async function IncidentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-blue-600">
                OGP
              </Link>
              <nav className="flex gap-4">
                <Link
                  href="/incidents"
                  className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600"
                >
                  📋 Lista
                </Link>
                <Link
                  href="/map"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  🗺️ Mapa
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <CreateIncidentButton />
              <span className="text-sm text-gray-600">{session.user.name}</span>
              {(session.user.role === "MANAGER" || session.user.role === "ADMIN") && (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <IncidentFilters />
        <IncidentList />
      </main>
    </div>
  );
}

