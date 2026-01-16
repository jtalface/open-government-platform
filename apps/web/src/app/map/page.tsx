import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import Link from "next/link";
import dynamic from "next/dynamic";

// Import IncidentMap with SSR disabled (Leaflet requires browser environment)
const IncidentMap = dynamic(() => import("@/components/map/SimpleIncidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-xl bg-gray-100">
      <div className="text-center">
        <div className="mb-4 text-4xl">🗺️</div>
        <p className="text-gray-600">Carregando mapa...</p>
      </div>
    </div>
  ),
});

export default async function MapPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-blue-600">
                OGP
              </Link>
              <nav className="flex gap-4">
                <Link
                  href="/incidents"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  📋 Lista
                </Link>
                <Link
                  href="/map"
                  className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600"
                >
                  🗺️ Mapa
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mapa de Ocorrências</h1>
          <p className="mt-2 text-gray-600">
            Visualize todas as ocorrências reportadas no mapa
          </p>
        </div>

        <IncidentMap showFilters />
      </main>
    </div>
  );
}

