import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { wizardData, plan } = await request.json();

  // Build project name from type + vision snippet
  const typeLabel =
    wizardData.projectType.charAt(0).toUpperCase() +
    wizardData.projectType.slice(1).replace(/_/g, " ");
  const visionSnippet = wizardData.vision.slice(0, 40).trim();
  const projectName = `${typeLabel} — ${visionSnippet}${wizardData.vision.length > 40 ? "..." : ""}`;

  // 1. Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: projectName,
      project_type: wizardData.projectType,
      vision: wizardData.vision,
      budget: wizardData.budget,
      timeline: wizardData.timeline,
      skill_level: wizardData.skillLevel,
      constraints: wizardData.constraints,
      other_constraints: wizardData.otherConstraints || null,
      zip_code: wizardData.zipCode || null,
      contractor_estimate: plan.contractor_estimate,
      diy_estimate: plan.diy_total_estimate,
      summary: plan.summary,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    console.error("Project insert error:", projectError);
    return NextResponse.json(
      { error: projectError?.message || "Failed to create project" },
      { status: 500 }
    );
  }

  // 2. Create stages
  for (let i = 0; i < plan.stages.length; i++) {
    const stage = plan.stages[i];

    const { data: stageRow, error: stageError } = await supabase
      .from("stages")
      .insert({
        project_id: project.id,
        title: stage.title,
        description: stage.description,
        reason: stage.reason,
        estimated_cost: stage.estimated_cost,
        estimated_hours: stage.estimated_hours,
        sort_order: i,
      })
      .select("id")
      .single();

    if (stageError || !stageRow) {
      console.error("Stage insert error:", stageError);
      continue;
    }

    // 3. Create steps for this stage
    if (stage.steps?.length > 0) {
      const stepRows = stage.steps.map(
        (
          step: {
            title: string;
            description: string;
            skill_level: string;
            estimated_minutes: number;
            tools_needed: string[];
          },
          j: number
        ) => ({
          stage_id: stageRow.id,
          title: step.title,
          description: step.description,
          skill_level: step.skill_level,
          estimated_minutes: step.estimated_minutes,
          tools_needed: step.tools_needed,
          sort_order: j,
        })
      );

      const { error: stepsError } = await supabase
        .from("steps")
        .insert(stepRows);

      if (stepsError) {
        console.error("Steps insert error:", stepsError);
      }
    }
  }

  return NextResponse.json({ projectId: project.id });
}
