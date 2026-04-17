import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectSettingsForm } from "@/components/project/ProjectSettingsForm";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, name, description, category, status, budget_total, contractor_estimate, diy_estimate, contingency_pct"
    )
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl text-charcoal">Project settings</h2>
      <ProjectSettingsForm project={project} />
    </div>
  );
}
