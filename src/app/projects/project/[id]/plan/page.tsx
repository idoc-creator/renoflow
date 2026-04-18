import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StageList, type StageData } from "@/components/project/StageList";
import {
  MilestonesList,
  type Milestone,
} from "@/components/project/MilestonesList";

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

  // Fetch names for any linked projects
  const linkedIds = Array.from(
    new Set(
      (stages || [])
        .map((s) => s.linked_project_id)
        .filter((v): v is string => !!v)
    )
  );
  const linkedNameById: Record<string, string> = {};
  if (linkedIds.length > 0) {
    const { data: linkedProjects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", linkedIds);
    for (const p of linkedProjects ?? []) {
      linkedNameById[p.id] = p.name;
    }
  }

  // Sort steps within each stage
  const sortedStages: StageData[] = (stages || []).map(
    (stage: StageData & { steps: StageData["steps"] }) => ({
      ...stage,
      linked_project_name: stage.linked_project_id
        ? linkedNameById[stage.linked_project_id] ?? null
        : null,
      steps: (stage.steps || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    })
  );

  // Milestones
  const { data: milestonesRaw } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  const stageOptions = sortedStages.map((s) => ({ id: s.id, title: s.title }));

  return (
    <>
      {/* Summary */}
      {project.summary && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-charcoal leading-relaxed">{project.summary}</p>
        </div>
      )}

      <div className="mb-6">
        <MilestonesList
          projectId={id}
          initial={(milestonesRaw ?? []) as Milestone[]}
          stages={stageOptions}
        />
      </div>

      <StageList stages={sortedStages} projectId={id} />
    </>
  );
}
