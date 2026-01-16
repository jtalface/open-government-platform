import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { CitizenHeader } from "@/components/CitizenHeader";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { PageHeader } from "@/components/PageHeader";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader session={session} activeTab="projects" />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <PageHeader titleKey="projects.title" descriptionKey="projects.description" />

        <ProjectsList />
      </main>
    </div>
  );
}

