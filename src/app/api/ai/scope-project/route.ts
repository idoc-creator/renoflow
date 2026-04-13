import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert renovation planner and DIY coach. You create detailed, staged renovation plans that are realistic, safe, and budget-conscious.

Your job is to take a homeowner's renovation vision and turn it into a practical, step-by-step staged plan they can actually execute.

Key principles:
- SEQUENCE stages by dependencies and livability. If they have one bathroom, that bathroom must remain usable between stages.
- CONSIDER the user's skill level honestly. Flag steps that should be hired out for safety or quality reasons (electrical, structural, plumbing rough-in, gas lines).
- PROVIDE realistic cost estimates. Material costs should reflect typical home improvement store pricing.
- EXPLAIN WHY each stage is ordered the way it is — help them understand dependencies.
- BE ENCOURAGING but honest. Don't sugarcoat difficulty, but show them it's achievable.
- BREAK complex tasks into small, manageable steps with time estimates.
- ACCOUNT for their constraints (budget phasing, living in the home, noise limits, tool access).
- For each step, note the skill level (beginner, intermediate, advanced) and tools needed.
- The contractor_estimate should reflect what a general contractor would charge for the same scope in their area.
- The diy_total_estimate should reflect just material costs plus any specialty subcontractor costs you recommend.`;

const JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    stages: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const, description: "Stage title, e.g. 'Demo & Prep'" },
          description: { type: "string" as const, description: "What this stage accomplishes" },
          reason: { type: "string" as const, description: "Why this stage is ordered here — explain dependencies" },
          estimated_cost: { type: "number" as const, description: "Estimated material cost for this stage in dollars" },
          estimated_hours: { type: "number" as const, description: "Estimated labor hours for a DIYer" },
          steps: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                title: { type: "string" as const },
                description: { type: "string" as const },
                skill_level: {
                  type: "string" as const,
                  enum: ["beginner", "intermediate", "advanced"],
                },
                estimated_minutes: { type: "number" as const },
                tools_needed: {
                  type: "array" as const,
                  items: { type: "string" as const },
                },
              },
              required: ["title", "description", "skill_level", "estimated_minutes", "tools_needed"],
            },
          },
        },
        required: ["title", "description", "reason", "estimated_cost", "estimated_hours", "steps"],
      },
    },
    contractor_estimate: {
      type: "number" as const,
      description: "What a contractor would charge for this entire scope",
    },
    diy_total_estimate: {
      type: "number" as const,
      description: "Total DIY cost (materials + any recommended subcontractors)",
    },
    summary: {
      type: "string" as const,
      description: "A friendly 2-3 sentence summary of the plan and encouragement",
    },
  },
  required: ["stages", "contractor_estimate", "diy_total_estimate", "summary"],
};

export async function POST(request: Request) {
  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const {
    projectType,
    vision,
    budget,
    timeline,
    skillLevel,
    constraints,
    otherConstraints,
    zipCode,
  } = body;

  const userMessage = `Please create a staged renovation plan for my project.

**Project type:** ${projectType}
**Vision:** ${vision}
**Budget range:** ${budget}
**Timeline:** ${timeline}
**Skill level:** ${skillLevel}
**Constraints:** ${constraints?.length > 0 ? constraints.join("; ") : "None specified"}
${otherConstraints ? `**Other constraints:** ${otherConstraints}` : ""}
${zipCode ? `**Location (ZIP):** ${zipCode}` : ""}

Create a realistic plan with proper staging, honest cost estimates, and clear step-by-step instructions. Remember to explain why each stage is ordered the way it is.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      output_config: {
        format: {
          type: "json_schema",
          schema: JSON_SCHEMA,
        },
      },
      messages: [{ role: "user", content: userMessage }],
    });

    // With structured output, the text block contains valid JSON directly
    const textBlock = response.content.find((b) => b.type === "text");
    const parsed = JSON.parse(textBlock!.text);

    // Stream the response back to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify(parsed)));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("AI scope error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate plan. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
