import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { insertStagesAndSteps } from "@/lib/projects/insertStagesAndSteps";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert DIY renovation planner and coach. Your job is to draft a practical, staged project plan that a homeowner can actually execute themselves.

Key principles:
- SEQUENCE stages by dependencies and livability. If a constraint says "only bathroom" or "living in house", stages must keep the space usable — don't leave the user without a toilet or shower unnecessarily. Break work into phases that preserve livability.
- RESPECT skill level. Flag steps that should be hired out for safety or code compliance (electrical, structural, gas) when the user is not experienced.
- HIGHLIGHT the specific skills the user wants to learn as their own stages or distinct step groups. If they want to run PEX themselves, give them a "Rough-in plumbing (PEX)" stage with real, specific steps.
- COST estimates should reflect realistic home-improvement-store pricing.
- EXPLAIN why each stage is ordered the way it is in the "reason" field — help them understand dependencies and livability tradeoffs.
- BE practical and honest about difficulty. Don't sugarcoat, but be encouraging.
- For each step, include: a clear title, a description with real detail (not vague), skill level, estimated minutes, and tools needed.

This is a TENTATIVE draft. The user will edit it. Prefer 4-7 stages with 3-8 steps each.`;

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
  },
  required: ["stages"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    projectId,
    scope,
    constraints,
    existingVsTarget,
    skillLevel,
    skillsToLearn,
  } = body as {
    projectId: string;
    scope: string;
    constraints: string[];
    existingVsTarget: string;
    skillLevel: string;
    skillsToLearn: string;
  };

  if (!projectId || !scope) {
    return Response.json(
      { error: "projectId and scope are required" },
      { status: 400 }
    );
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, category, budget_total")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const userMessage = `Please draft a staged plan for this DIY project.

**Project:** ${project.name}${project.category ? ` (${project.category})` : ""}
**Budget:** ${project.budget_total ? `$${project.budget_total}` : "Not specified"}
**Scope:** ${scope}
**Current state → target:** ${existingVsTarget || "Not specified"}
**Constraints:** ${constraints?.length > 0 ? constraints.join("; ") : "None specified"}
**Skill level:** ${skillLevel || "Not specified"}
**Specific skills they want to learn themselves:** ${skillsToLearn || "None specified"}

Draft a realistic plan with proper staging. Remember to explain why each stage is ordered the way it is, preserve livability given the constraints, and include real technical depth in the steps for skills the user specifically wants to learn.`;

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

    return Response.json({ ok: true, stageCount: parsed.stages?.length ?? 0 });
  } catch (error) {
    console.error("Draft plan error:", error);
    return Response.json(
      { error: "Failed to draft plan. Try again or start blank." },
      { status: 500 }
    );
  }
}
