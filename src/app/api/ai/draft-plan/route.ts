import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { insertStagesAndSteps } from "@/lib/projects/insertStagesAndSteps";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are an expert DIY renovation planner and coach. Your job is to draft a practical, staged project plan that a homeowner can actually execute themselves.

Key principles:
- SEQUENCE stages by dependencies and livability. If a constraint says "only bathroom" or "living in house", stages must keep the space usable — don't leave the user without a toilet or shower unnecessarily. Break work into phases that preserve livability.
- RESPECT skill level and the user's stated DIY scope. If a trade is in their hired_scope, the stage for that trade should be coordination-focused ("Mark box locations for electrician", "Schedule rough-in visit"), not how-to-wire-it steps.
- HONOR permits preference. If skip_permits is true, do not create permit/inspection steps. If false, include permit + inspection touchpoints.
- ANTICIPATE surprises for old houses and known-risky stages (demo in pre-1980, subfloor at toilet flange, lath-and-plaster dust). Mention them in the stage "reason" so the user knows what to expect.
- COST estimates should reflect realistic home-improvement-store pricing.
- EXPLAIN why each stage is ordered the way it is in the "reason" field — help them understand dependencies and livability tradeoffs.
- BE practical and honest about difficulty. Encouraging, never condescending.
- For each step, include: a clear title, a description with real detail, skill level, estimated minutes, and tools needed.

This is a TENTATIVE draft. The user will edit it. Prefer 5-8 stages with 3-8 steps each.`;

const PLAN_SCHEMA = {
  type: "object" as const,
  properties: {
    stages: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          description: { type: "string" as const },
          reason: { type: "string" as const },
          estimated_cost: { type: "number" as const },
          estimated_hours: { type: "number" as const },
          steps: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                title: { type: "string" as const },
                description: { type: "string" as const },
                skill_level: {
                  type: "string" as const,
                  enum: ["beginner", "intermediate", "advanced", "hire_out"],
                },
                estimated_minutes: { type: "integer" as const },
                tools_needed: {
                  type: "array" as const,
                  items: { type: "string" as const },
                },
              },
              required: [
                "title",
                "description",
                "skill_level",
                "estimated_minutes",
                "tools_needed",
              ],
              additionalProperties: false,
            },
          },
        },
        required: [
          "title",
          "description",
          "reason",
          "estimated_cost",
          "estimated_hours",
          "steps",
        ],
        additionalProperties: false,
      },
    },
    suggested_milestones: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          kind: {
            type: "string" as const,
            enum: ["permit", "inspection", "delivery", "other"],
          },
          notes: { type: "string" as const },
          blocks_stage_index: {
            type: ["integer", "null"] as const,
            description:
              "0-based index of the stage this milestone blocks (gates completing that stage). Null if it doesn't gate a specific stage.",
          },
        },
        required: ["title", "kind", "notes", "blocks_stage_index"],
        additionalProperties: false,
      },
    },
  },
  required: ["stages", "suggested_milestones"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const client = getAnthropicClient();
  if (!client) {
    return Response.json(
      {
        error:
          "Plan drafting is unavailable — ANTHROPIC_API_KEY is not set in .env.local.",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    projectId: string;
    // Legacy prompt-driven fields (kept for back-compat).
    scope?: string;
    constraints?: string[];
    existingVsTarget?: string;
    skillLevel?: string;
    skillsToLearn?: string;
    // New intake-driven path.
    useIntake?: boolean;
  };

  const { projectId, useIntake } = body;

  if (!projectId) {
    return Response.json({ error: "projectId required" }, { status: 400 });
  }

  // Verify project ownership + pull intake if requested
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, category, budget_total, intake_data, intake_complete, skip_permits"
    )
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  let userMessage: string;

  if (useIntake) {
    const intake = (project.intake_data ?? {}) as Record<string, unknown>;
    if (!intake || Object.keys(intake).length === 0) {
      return Response.json(
        { error: "No intake data yet — run the intake first." },
        { status: 400 }
      );
    }
    userMessage = `Draft a staged plan using the intake below.

Project name: ${project.name}
Skip permits: ${project.skip_permits === true ? "YES (do not generate permit/inspection milestones, but you may mention in stage reasons that permits would normally apply here)" : "NO — include permits + inspections as suggested_milestones"}

Full intake:
${JSON.stringify(intake, null, 2)}

Requirements:
- Respect diy_scope vs hired_scope. For hired trades, generate COORDINATION stages, not how-to stages.
- If walls_type is "lath_plaster" or year_built is pre-1980, include an early "Test + Protect" stage covering lead/asbestos testing, dust containment, tub protection.
- If location is Oregon + is_primary_residence is true + electrical is DIY, mention the Oregon homeowner electrical permit affidavit in that stage's reason.
- Suggest 2-6 milestones (permits, inspections, long-lead-time deliveries). Set blocks_stage_index where appropriate (e.g., rough-in inspection blocks the stage that closes walls).
- For each "Likely surprises" that apply to a stage, include them in its "reason" field naturally.`;
  } else {
    const {
      scope,
      constraints,
      existingVsTarget,
      skillLevel,
      skillsToLearn,
    } = body;
    if (!scope) {
      return Response.json({ error: "scope required" }, { status: 400 });
    }
    userMessage = `Please draft a staged plan for this DIY project.

**Project:** ${project.name}${project.category ? ` (${project.category})` : ""}
**Budget:** ${project.budget_total ? `$${project.budget_total}` : "Not specified"}
**Scope:** ${scope}
**Current state → target:** ${existingVsTarget || "Not specified"}
**Constraints:** ${constraints && constraints.length > 0 ? constraints.join("; ") : "None specified"}
**Skill level:** ${skillLevel || "Not specified"}
**Specific skills they want to learn themselves:** ${skillsToLearn || "None specified"}

Include an empty suggested_milestones array unless permits/inspections obviously apply.`;
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      output_config: {
        format: {
          type: "json_schema",
          schema: PLAN_SCHEMA,
        },
      },
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI");
    }

    const parsed = JSON.parse(textBlock.text);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await insertStagesAndSteps(supabase as any, projectId, parsed);

    // Re-fetch just-inserted stages so we can resolve blocks_stage_index → stage_id
    if (
      parsed.suggested_milestones?.length > 0 &&
      project.skip_permits !== true
    ) {
      const { data: insertedStages } = await supabase
        .from("stages")
        .select("id, sort_order")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      const stagesList = insertedStages ?? [];
      const milestonesToInsert = parsed.suggested_milestones.map(
        (
          m: {
            title: string;
            kind: string;
            notes: string;
            blocks_stage_index: number | null;
          },
          idx: number
        ) => ({
          project_id: projectId,
          title: m.title,
          kind: m.kind,
          status: "pending",
          notes: m.notes,
          blocks_stage_id:
            m.blocks_stage_index !== null &&
            m.blocks_stage_index >= 0 &&
            m.blocks_stage_index < stagesList.length
              ? stagesList[m.blocks_stage_index].id
              : null,
          sort_order: idx,
        })
      );

      if (milestonesToInsert.length > 0) {
        await supabase.from("project_milestones").insert(milestonesToInsert);
      }
    }

    return Response.json({ ok: true, stageCount: parsed.stages?.length ?? 0 });
  } catch (error) {
    console.error("Draft plan error:", error);
    return Response.json(
      { error: "Failed to draft plan. Try again or start blank." },
      { status: 500 }
    );
  }
}
