import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { CitizenHeader } from "@/components/CitizenHeader";
import { PageHeader } from "@/components/PageHeader";
import { PollBanner } from "@/components/polls/PollBanner";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader session={session} activeTab="map" />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Poll Banner */}
        <PollBanner municipalityId={session.user.municipalityId} />

        <div className="mb-6">
          <PageHeader titleKey="map.title" descriptionKey="map.description" />
        </div>

        <IncidentMap showFilters />
      </main>
    </div>
  );
}

