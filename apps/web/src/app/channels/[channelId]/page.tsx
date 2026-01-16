import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { CitizenHeader } from "@/components/CitizenHeader";
import { ChannelDetail } from "@/components/channels/ChannelDetail";

interface ChannelPageProps {
  params: {
    channelId: string;
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader session={session} activeTab="channels" />

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <ChannelDetail channelId={params.channelId} />
      </main>
    </div>
  );
}

