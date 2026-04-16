import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProjectOverview from "@/components/project/ProjectOverview";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, name, description, category, cover_image_url, budget_total, budget_spent, contractor_estimate, diy_estimate, status"
    )
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Count stages + steps
  const { data: stages } = await supabase
    .from("stages")
    .select("id, steps(id, is_completed)")
    .eq("project_id", id);

  const stageCount = stages?.length ?? 0;
  const stepCount =
    stages?.reduce(
      (sum, s) => sum + ((s.steps as { id: string }[])?.length ?? 0),
      0
    ) ?? 0;
  const completedStepCount =
    stages?.reduce(
      (sum, s) =>
        sum +
        ((s.steps as { is_completed: boolean }[])?.filter(
          (step) => step.is_completed
        ).length ?? 0),
      0
    ) ?? 0;

  return (
    <ProjectOverview
      project={project}
      stageCount={stageCount}
      stepCount={stepCount}
      completedStepCount={completedStepCount}
    />
  );
}
