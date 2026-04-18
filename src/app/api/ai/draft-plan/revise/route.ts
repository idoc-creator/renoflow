import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { parseStructuredResponse } from "@/lib/ai/parseStructuredResponse";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

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
interface Plan {
  stages: Stage[];
  suggested_milestones: Milestone[];
}

const SYSTEM_PROMPT = `You revise a DIY project plan based on a user's natural-language feedback. They'll tell you things like:
- "Remove the lath test stage, I already did it"
- "Break the tile stage into two — I'm overwhelmed"
- "Add a stage for building the vanity myself"
- "The electrical stage should assume I'm hiring it out"
- "More detail on the plumbing rough-in"

RULES:
- Return a COMPLETE revised plan (all stages + all milestones), not just a diff.
- Preserve what the user didn't touch on.
- If they ask for removal, remove it. If they ask for more detail, add specific steps.
- If they want a new stage, place it at the right point in the sequence.
- Don't add stages they didn't ask for. Be surgical.
- Milestone blocks_stage_index must still point at valid stage indices in the NEW plan.
- Keep the same schema exactly.`;

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
          blocks_stage_index: { type: ["integer", "null"] as const },
        },
        required: ["title", "kind", "notes", "blocks_stage_index"],
        additionalProperties: false,
      },
    },
  },
  required: ["stages", "suggested_milestones"],
  additionalProperties: false,
};

/**
 * Keyword-based mock revision so the UX can be tested without the real AI.
 * Supports: remove stages by keyword, add a stub stage when user says "add a
 * stage for X", append a detail step when user says "more detail on X".
 */
function mockRevise(plan: Plan, feedback: string): Plan {
  const fb = feedback.toLowerCase();
  let stages = [...plan.stages];

  // REMOVE — "remove the X stage", "drop the X", "skip the X", "don't need X"
  const removeMatch = fb.match(
    /\b(remove|drop|skip|delete|don'?t need|get rid of)\b(?:\s+the)?\s+([a-z+& -]+?)(?:\s+stage|,|\.|$)/
  );
  if (removeMatch) {
    const term = removeMatch[2].trim();
    stages = stages.filter((s) => !s.title.toLowerCase().includes(term));
  }

  // ADD — "add a stage for X", "add X stage", "include a X stage"
  const addMatch = fb.match(
    /\b(add|include|insert)\s+(?:a\s+)?(?:stage\s+(?:for\s+|to\s+)?|new\s+stage\s+(?:for\s+)?)?([a-z+& -]+?)(?:\s+stage)?(?:,|\.|$)/
  );
  if (addMatch) {
    const title =
      addMatch[2]
        .trim()
        .replace(/^(for|to)\s+/, "")
        .replace(/^\w/, (c) => c.toUpperCase()) || "New stage";
    const newStage: Stage = {
      title,
      description: `Added from your feedback: ${feedback.trim()}`,
      reason:
        "You asked to include this. Add your own steps or regenerate with more AI input.",
      estimated_cost: 0,
      estimated_hours: 0,
      steps: [
        {
          title: `Plan ${title.toLowerCase()}`,
          description:
            "Placeholder — flesh this out with specific steps. (Mock mode can't generate real content.)",
          skill_level: "intermediate",
          estimated_minutes: 60,
          tools_needed: [],
        },
      ],
    };
    stages.push(newStage);
  }

  // MORE DETAIL — "more detail on X" adds a step to the matching stage
  const detailMatch = fb.match(/more detail(?:s)? (?:on|for|about)\s+([a-z+& -]+?)(?:,|\.|$)/);
  if (detailMatch) {
    const term = detailMatch[1].trim();
    stages = stages.map((s) => {
      if (!s.title.toLowerCase().includes(term)) return s;
      return {
        ...s,
        steps: [
          ...s.steps,
          {
            title: `More detail on ${s.title.toLowerCase()} (mock)`,
            description:
              "Placeholder — real AI would expand with step-level specifics here.",
            skill_level: "intermediate",
            estimated_minutes: 45,
            tools_needed: [],
          },
        ],
      };
    });
  }

  // Filter milestones pointing at removed stages back to null
  const milestones = (plan.suggested_milestones ?? []).map((m) => {
    if (m.blocks_stage_index === null) return m;
    const origStage = plan.stages[m.blocks_stage_index];
    if (!origStage) return { ...m, blocks_stage_index: null };
    const newIdx = stages.findIndex((s) => s.title === origStage.title);
    return { ...m, blocks_stage_index: newIdx >= 0 ? newIdx : null };
  });

  return { stages, suggested_milestones: milestones };
}

export async function POST(request: Request) {
  const client = getAnthropicClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    projectId: string;
    plan: Plan;
    feedback: string;
  };
  const { projectId, plan, feedback } = body;
  if (!projectId || !plan || !feedback?.trim()) {
    return Response.json(
      { error: "projectId, plan, and feedback required" },
      { status: 400 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, intake_data, skip_permits")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Mock fallback
  if (!client) {
    const revised = mockRevise(plan, feedback);
    return Response.json({
      ok: true,
      mock: true,
      plan: revised,
    });
  }

  const userMessage = `Revise this plan based on the user's feedback.

User feedback:
"""
${feedback.trim()}
"""

Current plan (JSON):
${JSON.stringify(plan, null, 2)}

Intake context (for reference):
${JSON.stringify(project.intake_data ?? {}, null, 2)}

Skip permits: ${project.skip_permits === true}

Return the COMPLETE revised plan. Be surgical — only change what the user asked to change.`;

  try {
    // Haiku 4.5 — see draft-plan/route.ts for rationale (Sonnet was hitting
    // 4-9min response times on this shape).
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: {
        format: {
          type: "json_schema",
          schema: PLAN_SCHEMA,
        },
      },
      messages: [{ role: "user", content: userMessage }],
    });

    const parsed = parseStructuredResponse<Plan>(response, "revise");
    return Response.json({ ok: true, plan: parsed });
  } catch (error) {
    console.error("Revise plan error:", error);
    return Response.json(
      { error: "Revise failed. Try different wording, or commit what you have." },
      { status: 500 }
    );
  }
}
