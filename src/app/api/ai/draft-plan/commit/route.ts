import { createClient } from "@/lib/supabase/server";
import { insertStagesAndSteps } from "@/lib/projects/insertStagesAndSteps";

interface Step {
  title: string;
  description: string;
  skill_level: string;
  estimated_minutes: number;
  tools_needed: string[];
}

interface Stage {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
  steps: Step[];
}

interface Milestone {
  title: string;
  kind: string;
  notes: string;
  blocks_stage_index: number | null;
}

/**
 * Commit a reviewed plan. Takes the plan JSON (as returned by draft-plan with
 * preview=true) plus the indices of stages and milestones the user accepted.
 *
 * Rebuilds blocks_stage_index against the new (accepted-only) ordering so
 * milestones still point at the right stage after any rejections.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    projectId: string;
    plan: { stages: Stage[]; suggested_milestones: Milestone[] };
    accepted_stage_indices: number[];
    accepted_milestone_indices: number[];
  };

  const { projectId, plan, accepted_stage_indices, accepted_milestone_indices } =
    body;

  if (!projectId || !plan?.stages) {
    return Response.json(
      { error: "projectId + plan required" },
      { status: 400 }
    );
  }

  // Confirm ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, skip_permits")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Build accepted stages, preserving original order.
  const accepted = new Set(accepted_stage_indices);
  const keptStages: Stage[] = [];
  // Map original index → new index, so milestones can be re-pointed.
  const oldToNewIndex = new Map<number, number>();
  plan.stages.forEach((s, i) => {
    if (accepted.has(i)) {
      oldToNewIndex.set(i, keptStages.length);
      keptStages.push(s);
    }
  });

  if (keptStages.length === 0) {
    return Response.json(
      { error: "Accept at least one stage or cancel the review." },
      { status: 400 }
    );
  }

  // Insert stages + steps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await insertStagesAndSteps(supabase as any, projectId, {
    stages: keptStages,
  });

  // Milestones — re-point blocks_stage_index
  const mAccepted = new Set(accepted_milestone_indices);
  const keptMilestones = (plan.suggested_milestones ?? [])
    .map((m, idx) => ({ m, idx }))
    .filter(({ idx }) => mAccepted.has(idx))
    .map(({ m }) => m);

  if (keptMilestones.length > 0) {
    const { data: insertedStages } = await supabase
      .from("stages")
      .select("id, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });
    const stagesList = insertedStages ?? [];

    const rows = keptMilestones.map((m, idx) => {
      const newBlockIndex =
        m.blocks_stage_index !== null
          ? oldToNewIndex.get(m.blocks_stage_index)
          : undefined;
      return {
        project_id: projectId,
        title: m.title,
        kind: m.kind,
        status: "pending",
        notes: m.notes,
        blocks_stage_id:
          typeof newBlockIndex === "number" &&
          newBlockIndex < stagesList.length
            ? stagesList[stagesList.length - keptStages.length + newBlockIndex]
                .id
            : null,
        sort_order: idx,
      };
    });

    await supabase.from("project_milestones").insert(rows);
  }

  return Response.json({
    ok: true,
    stageCount: keptStages.length,
    milestoneCount: keptMilestones.length,
  });
}
