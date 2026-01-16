import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { CitizenHeader } from "@/components/CitizenHeader";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

export default async function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader session={session} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <ProjectDetail projectId={params.projectId} />
      </main>
    </div>
  );
}

