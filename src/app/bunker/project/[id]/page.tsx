import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SavingsDashboard } from "@/components/project/SavingsDashboard";
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

  const actualCostTotal = sortedStages.reduce(
    (sum: number, s: StageData) => sum + (Number(s.actual_cost) || 0),
    0
  );

  return (
    <>
      {/* Summary */}
      {project.summary && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-slate-700 leading-relaxed">{project.summary}</p>
        </div>
      )}

      {/* Two-column layout: stages left, savings right */}
      <div className="flex flex-col-reverse gap-6 lg:flex-row">
        {/* Left column — stages */}
        <div className="flex-1 min-w-0 lg:basis-2/3">
          <StageList stages={sortedStages} />
        </div>

        {/* Right column — savings dashboard (sticky on desktop) */}
        <div className="lg:basis-1/3">
          <div className="lg:sticky lg:top-6">
            <SavingsDashboard
              contractorEstimate={Number(project.contractor_estimate) || 0}
              diyEstimate={Number(project.diy_estimate) || 0}
              budgetTotal={Number(project.budget_total) || 0}
              budgetSpent={Number(project.budget_spent) || 0}
              actualCostTotal={actualCostTotal}
            />
          </div>
        </div>
      </div>
    </>
  );
}
