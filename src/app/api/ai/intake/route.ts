import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { runMockIntake } from "@/lib/ai/mockIntake";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

/**
 * Intake field surface — what the AI is trying to capture across the chat.
 *
 * The AI decides WHICH to ask based on what's already populated and what the
 * user has said. `specifics` is an open object for category-branched detail
 * (bathroom → keep_tub, walls; furniture → wood, joinery; craft → materials).
 */
const INTAKE_FIELDS_DOC = `
REQUIRED INTAKE FIELDS (capture progressively via conversation):

Core (ask every project):
- category: "renovation" | "furniture" | "decor" | "craft" | "outdoor" | "other"
- project_goal: short plain-English statement ("Full gut of primary bathroom, keep the cast-iron tub")
- primary_motivation: "save money" | "learn skills" | "can't find what i want" | "other"
- help: "solo" | "partner" | "friend" | "multiple"
- weekends_available: integer (realistic weekends they can commit)
- skill_comfort: 1-5 (1 = never held a drill, 5 = framed a shed)
- budget_total: number (their ceiling, nullable)
- budget_flexibility: "firm" | "somewhat" | "flexible"
- timeline_pressure: short string (date or urgency)
- diy_scope: string[] — trades they will DIY (e.g. ["demo","plumbing","tile","paint"])
- hired_scope: string[] — trades they'll hire out
- skip_permits: boolean (capture explicitly; respect it if true)

Location (ask only when relevant — reno/outdoor, skip for craft/small furniture):
- location.city: string
- location.county: string
- location.state: string (2-letter)
- is_primary_residence: boolean (gates Oregon homeowner permit rules)
- year_built: number (drives asbestos/lead/code-era branches)

Category-specific "specifics" object (branch based on category):
- Bathroom renos: { keep_tub, walls_type ("drywall"|"lath_plaster"|"tile"|"unknown"), layout_change, has_backup_bathroom, panel_spare_breaker ("yes"|"no"|"unknown") }
- Kitchens: { keep_cabinets, keep_appliances, layout_change, island }
- Furniture builds: { wood_species, finish_type, joinery_comfort }
- Crafts: { primary_materials, batch_size }

Side builds detected in conversation:
- discovered_sub_projects: Array<{ title, reason_it_came_up }>
  e.g. user says "I want to build my own vanity" → capture it.

Accessibility & safety flags (short, easy):
- accessibility_needs: string | null (e.g. "grab bars within 5 years")
- asbestos_tested: boolean | null (only for pre-1980 renos)
- lead_tested: boolean | null (only for pre-1978 renos)
`;

const SYSTEM_PROMPT = `You are a warm, sharp project-planning coach for Bench, a DIY app. You're running the INTAKE INTERVIEW for a user's new project — imagine you're a contractor friend who showed up to scope the job. Your job is to capture enough context that a downstream planner can draft a tailored plan.

STYLE:
- Conversational, short. One question at a time (occasionally two tightly-related ones).
- Warm and a little funny. Never condescending.
- Every 3 answers or so, give a quick RECAP so the user feels progress ("OK — so I'm hearing [X, Y, Z]. Getting closer. Still need to know about [W].")
- If the user mentions a side build ("I want to build my vanity"), acknowledge it, capture it as a discovered sub-project, but don't derail — note it and return to the main thread.
- If the user says they want to skip permits, honor it immediately. Mention resale/insurance risk ONCE gently, then drop it.
- Use category-specific branches: don't ask bathroom questions for a craft project.
- When the user's answer is vague, gently probe once. Don't interrogate.

PACING:
- Aim for 8–12 total questions. Stop when you have enough to draft a useful plan.
- Mark is_complete: true on your final turn, with a nice wrap message.

STRUCTURE OF EACH RESPONSE (JSON):
- reply: the next question only. Keep it short. DO NOT prepend the recap to this field — the UI renders the recap as its own bubble above your reply.
- intake_patch: ONLY the fields you learned this turn. Do not re-send fields already captured.
- progress: { captured_count, estimated_total, recap } — when you're ready to give a recap (every ~3 turns), put the recap text HERE and NOT in the reply. Otherwise set recap to null.
- is_complete: true only when you're wrapping up.
- detected_sub_projects: any side builds mentioned this turn.

${INTAKE_FIELDS_DOC}

Remember: conversational, progressive, branched. Don't be a form.`;

const RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    reply: { type: "string" as const },
    intake_patch: {
      type: "object" as const,
      additionalProperties: true,
    },
    progress: {
      type: "object" as const,
      properties: {
        captured_count: { type: "integer" as const },
        estimated_total: { type: "integer" as const },
        recap: { type: ["string", "null"] as const },
      },
      required: ["captured_count", "estimated_total", "recap"],
      additionalProperties: false,
    },
    is_complete: { type: "boolean" as const },
    detected_sub_projects: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          reason_it_came_up: { type: "string" as const },
        },
        required: ["title", "reason_it_came_up"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "reply",
    "intake_patch",
    "progress",
    "is_complete",
    "detected_sub_projects",
  ],
  additionalProperties: false,
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
    messages: ChatMessage[];
    intakeSoFar?: Record<string, unknown>;
  };

  const { projectId, messages, intakeSoFar } = body;

  if (!projectId) {
    return Response.json({ error: "projectId required" }, { status: 400 });
  }

  // Confirm ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, category")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // No API key? Fall back to the scripted mock so the UX can be tested
  // end-to-end without configuration.
  if (!client) {
    const userTurns = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content);
    const mock = runMockIntake({
      projectName: project.name,
      userTurns,
      intakeSoFar: intakeSoFar ?? {},
    });

    const merged = {
      ...(intakeSoFar ?? {}),
      ...mock.intake_patch,
    };
    for (const key of ["specifics", "location"] as const) {
      if (
        mock.intake_patch[key] &&
        typeof mock.intake_patch[key] === "object" &&
        intakeSoFar?.[key] &&
        typeof intakeSoFar[key] === "object"
      ) {
        merged[key] = {
          ...(intakeSoFar[key] as Record<string, unknown>),
          ...(mock.intake_patch[key] as Record<string, unknown>),
        };
      }
    }

    await supabase
      .from("projects")
      .update({
        intake_data: merged,
        intake_complete: mock.is_complete === true,
        skip_permits: merged.skip_permits === true,
      })
      .eq("id", projectId);

    return Response.json({
      reply: mock.reply,
      intake: merged,
      progress: mock.progress,
      is_complete: mock.is_complete,
      detected_sub_projects: mock.detected_sub_projects,
      mock: true,
    });
  }

  // Prepend a system context message that tells the AI what's already captured
  const contextBlock = `CURRENT INTAKE STATE:
Project name: ${project.name}
Project category hint (from project row): ${project.category || "not yet known"}
Intake captured so far: ${JSON.stringify(intakeSoFar ?? {}, null, 2)}

If the chat messages below are empty, this is the FIRST turn — kick off the interview with a warm opener that references the project name and asks the most useful first question (typically: "tell me what you want to do and why" in your own words).`;

  const chatMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // If there are no messages yet, we still need a user turn so Claude responds.
  if (chatMessages.length === 0) {
    chatMessages.push({ role: "user", content: "(start)" });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        { type: "text", text: contextBlock },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: RESPONSE_SCHEMA,
        },
      },
      messages: chatMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response");
    }

    const parsed = JSON.parse(textBlock.text);

    // Merge the intake patch into what's stored on the project.
    const merged = {
      ...(intakeSoFar ?? {}),
      ...(parsed.intake_patch ?? {}),
    };
    // Deep-merge the "specifics" and "location" sub-objects so partial updates
    // don't wipe prior fields.
    for (const key of ["specifics", "location"] as const) {
      if (
        parsed.intake_patch?.[key] &&
        typeof parsed.intake_patch[key] === "object" &&
        intakeSoFar?.[key] &&
        typeof intakeSoFar[key] === "object"
      ) {
        merged[key] = {
          ...(intakeSoFar[key] as Record<string, unknown>),
          ...(parsed.intake_patch[key] as Record<string, unknown>),
        };
      }
    }

    // Persist progress so if the user bounces out we can resume.
    await supabase
      .from("projects")
      .update({
        intake_data: merged,
        intake_complete: parsed.is_complete === true,
        skip_permits:
          merged.skip_permits === true ? true : project.category === "craft",
      })
      .eq("id", projectId);

    return Response.json({
      reply: parsed.reply,
      intake: merged,
      progress: parsed.progress,
      is_complete: parsed.is_complete,
      detected_sub_projects: parsed.detected_sub_projects ?? [],
    });
  } catch (error) {
    console.error("Intake error:", error);
    return Response.json(
      { error: "Intake hiccup — try sending that again." },
      { status: 500 }
    );
  }
}
