import type { SupabaseClient } from "@supabase/supabase-js";

interface Step {
  title: string;
  description: string;
  skill_level: string;
  estimated_minutes: number;
  tools_needed: string[];
  materials_needed?: Array<{ name: string; quantity: number; unit: string }>;
}

interface Stage {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
  steps: Step[];
}

interface PlanData {
  stages: Stage[];
}

interface CreateProjectArgs {
  supabase: SupabaseClient;
  userId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  coverImageUrl?: string | null;
  clonedFromTemplateId?: string | null;
  budgetTotal?: number | null;
  contractorEstimate?: number | null;
  planData: PlanData;
}

export async function createProjectFromPlan(
  args: CreateProjectArgs
): Promise<string> {
  const { data: project, error: projectError } = await args.supabase
    .from("projects")
    .insert({
      user_id: args.userId,
      name: args.name,
      description: args.description ?? null,
      category: args.category ?? null,
      cover_image_url: args.coverImageUrl ?? null,
      cloned_from_template_id: args.clonedFromTemplateId ?? null,
      budget_total: args.budgetTotal ?? null,
      contractor_estimate: args.contractorEstimate ?? null,
      status: "planning",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to create project: ${projectError?.message}`);
  }

  for (let i = 0; i < args.planData.stages.length; i++) {
    const stage = args.planData.stages[i];
    const { data: stageRow, error: stageError } = await args.supabase
      .from("stages")
      .insert({
        project_id: project.id,
        title: stage.title,
        description: stage.description,
        reason: stage.reason,
        estimated_cost: stage.estimated_cost,
        estimated_hours: stage.estimated_hours,
        sort_order: i,
        status: "pending",
      })
      .select("id")
      .single();

    if (stageError || !stageRow) {
      throw new Error(`Failed to create stage: ${stageError?.message}`);
    }

    if (stage.steps && stage.steps.length > 0) {
      const stepsToInsert = stage.steps.map((step, idx) => ({
        stage_id: stageRow.id,
        title: step.title,
        description: step.description,
        skill_level: step.skill_level,
        estimated_minutes: step.estimated_minutes,
        tools_needed: step.tools_needed || [],
        materials_needed: step.materials_needed || [],
        sort_order: idx,
        is_completed: false,
      }));

      const { error: stepsError } = await args.supabase
        .from("steps")
        .insert(stepsToInsert);

      if (stepsError) {
        throw new Error(`Failed to create steps: ${stepsError.message}`);
      }
    }
  }

  return project.id;
}
