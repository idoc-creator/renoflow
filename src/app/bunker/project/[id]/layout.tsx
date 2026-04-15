import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { ProjectNav } from "@/components/project/ProjectNav";

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
    .select("id, name, status")
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
        href="/bunker"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <FiArrowLeft className="h-4 w-4" />
        All Projects
      </Link>

      {/* Project header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
          {statusLabel}
        </span>
      </div>

      {/* Tab navigation */}
      <div className="mb-6">
        <ProjectNav projectId={id} />
      </div>

      {children}
    </div>
  );
}
