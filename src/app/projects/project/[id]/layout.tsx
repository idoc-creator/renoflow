import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSettings } from "react-icons/fi";
import { ProjectNav } from "@/components/project/ProjectNav";
import AskBenchDrawer from "@/components/project/AskBenchDrawer";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, status, category")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const statusLabel = (project.status || "planning").replace("_", " ");

  return (
    <div className="mx-auto max-w-6xl">
      {/* Back link */}
      <Link
        href="/projects"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray transition-colors hover:text-charcoal"
      >
        <FiArrowLeft className="h-4 w-4" />
        All Projects
      </Link>

      {/* Project header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-charcoal">{project.name}</h1>
        <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium capitalize text-warm-gray">
          {statusLabel}
        </span>
        <Link
          href={`/projects/project/${id}/settings`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border-warm bg-white px-3 py-1.5 text-xs font-medium text-warm-gray transition-colors hover:border-terracotta hover:text-charcoal"
          aria-label="Project settings"
        >
          <FiSettings className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="mb-6">
        <ProjectNav projectId={id} />
      </div>

      {children}
      <AskBenchDrawer projectId={id} projectCategory={project.category ?? undefined} />
    </div>
  );
}
