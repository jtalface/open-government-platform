import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { CitizenHeader } from "@/components/CitizenHeader";
import { PageHeader } from "@/components/PageHeader";
import dynamic from "next/dynamic";

// Import IncidentMap with SSR disabled (Leaflet requires browser environment)
const IncidentMap = dynamic(() => import("@/components/map/SimpleIncidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-xl bg-gray-100">
      <div className="text-center">
        <div className="mb-4 text-4xl">🗺️</div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default async function MapPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const showDashboard = session.user.role === "MANAGER" || session.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader userName={session.user.name || ""} showDashboard={showDashboard} />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <PageHeader titleKey="map.title" descriptionKey="map.description" />
        </div>

        <IncidentMap showFilters />
      </main>
    </div>
  );
}

