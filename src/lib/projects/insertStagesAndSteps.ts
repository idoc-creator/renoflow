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

interface ToolboxItem {
  id: string;
  name: string;
}

/**
 * Inserts stages and steps into an existing project. Does NOT create a project.
 * Appends to whatever stages already exist (sort_order starts at current max + 1).
 *
 * If toolbox is provided, `step_tools` on each step is populated with
 * { name, toolbox_item_id, need_to_buy } so the UI can show ✓ for tools the
 * user already owns and 🛒 for anything new.
 */
export async function insertStagesAndSteps(
  supabase: SupabaseClient,
  projectId: string,
  planData: PlanData,
  toolbox?: ToolboxItem[]
): Promise<void> {
  // Find the current max sort_order for this project's stages
  const { data: existing } = await supabase
    .from("stages")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const startIndex = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  // Build a simple name → id lookup for the toolbox (lowercased, trimmed).
  const toolboxByName = new Map<string, string>();
  for (const t of toolbox ?? []) {
    toolboxByName.set(t.name.trim().toLowerCase(), t.id);
  }

  function resolveStepTools(toolsNeeded: string[]): Array<{
    name: string;
    toolbox_item_id: string | null;
    need_to_buy: boolean;
  }> {
    return (toolsNeeded || []).map((t) => {
      const key = t.trim().toLowerCase();
      // Try exact match first, then a looser substring match both ways
      // (e.g. "miter saw" matches toolbox "10\" miter saw").
      let id: string | null = toolboxByName.get(key) ?? null;
      if (!id) {
        for (const [name, itemId] of toolboxByName.entries()) {
          if (name.includes(key) || key.includes(name)) {
            id = itemId;
            break;
          }
        }
      }
      return {
        name: t,
        toolbox_item_id: id,
        need_to_buy: id === null,
      };
    });
  }

  for (let i = 0; i < planData.stages.length; i++) {
    const stage = planData.stages[i];
    const { data: stageRow, error: stageError } = await supabase
      .from("stages")
      .insert({
        project_id: projectId,
        title: stage.title,
        description: stage.description,
        reason: stage.reason,
        estimated_cost: stage.estimated_cost,
        estimated_hours: stage.estimated_hours,
        sort_order: startIndex + i,
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
        step_tools: resolveStepTools(step.tools_needed || []),
        materials_needed: step.materials_needed || [],
        sort_order: idx,
        is_completed: false,
      }));

      const { error: stepsError } = await supabase
        .from("steps")
        .insert(stepsToInsert);

      if (stepsError) {
        throw new Error(`Failed to create steps: ${stepsError.message}`);
      }
    }
  }
}
