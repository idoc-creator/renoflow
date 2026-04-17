import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StageList, type StageData } from "@/components/project/StageList";

export default async function ProjectPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch stages with their steps
  const { data: stages } = await supabase
    .from("stages")
    .select("*, steps(*)")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  // Sort steps within each stage
  const sortedStages: StageData[] = (stages || []).map(
    (stage: StageData & { steps: StageData["steps"] }) => ({
      ...stage,
      steps: (stage.steps || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    })
  );

  return (
    <>
      {/* Summary */}
      {project.summary && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-charcoal leading-relaxed">{project.summary}</p>
        </div>
      )}

      <StageList stages={sortedStages} projectId={id} />
    </>
  );
}
