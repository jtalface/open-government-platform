import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { CitizenHeader } from "@/components/CitizenHeader";
import { PageHeader } from "@/components/PageHeader";
import { ChannelsList } from "@/components/channels/ChannelsList";

export default async function ChannelsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader session={session} activeTab="channels" />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <PageHeader
          titleKey="channels.title"
          descriptionKey="channels.description"
        />

        <ChannelsList />
      </main>
    </div>
  );
}

