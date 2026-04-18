import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { runMockIntake } from "@/lib/ai/mockIntake";
import { parseStructuredResponse } from "@/lib/ai/parseStructuredResponse";

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

const SYSTEM_PROMPT = `You are a warm, sharp project-planning coach for Bench, a DIY app. You're a contractor friend doing a kitchen-table walkthrough of someone's project. Capture enough context that a downstream planner can draft a tailored plan they actually trust.

CRITICAL RULES — IF YOU ONLY READ ONE THING:

1. **ONE QUESTION PER TURN.** Never two. Never compound questions. The opener asks ONE thing — usually "what are you building, and why?" — and waits.

2. **NEVER RE-ASK SOMETHING ALREADY KNOWN.** The context block tells you what's already in the project (name, category, budget, etc) and what's already in the intake. If category is "renovation," do NOT ask "what type of project is this?" If budget_total is set, do NOT ask "what's your budget?" If timeline_pressure mentions "July 4th + a few weekends off for vacation," do NOT ask "how many weekends?" — they already gave you BOTH the date and the working pattern.

3. **NO MID-CONVERSATION RECAPS.** Set progress.recap = null on every turn EXCEPT the final wrap turn (where is_complete = true). The wrap recap is the ONLY recap. No "so far I've heard..." mid-flow.

BRANCHING BY PROJECT TYPE:

- CRAFT / DECOR: 4–6 questions. Materials, tools on hand, rough scale, skill, timeline. NEVER ask permits, year built, lath/plaster, DIY/hire, electrical, or tub.
- FURNITURE BUILDS: 5–7 questions. Wood/material, finish, design status (have plans? designing?), skill, timeline. NEVER ask permits/location/residence.
- OUTDOOR BUILDS: location (permits vary), DIY scope, help, weekends, skill, budget, timeline.
- RENOVATIONS: see below.

RENOVATION SCOPE DRILLING (this is the part where most intakes feel shallow — go deep here):

After category/goal/location/residence, drill into SCOPE OF WORK. The plan accuracy lives here. For ANY renovation that's a "gut" or "remodel," ask in this order, ONE per turn:

1. **Wall depth**: "Are we tearing out everything down to studs, or surface-level only (paint/tile/fixtures)?" — picks: down-to-studs / surface-level / partial (some walls open).
2. **Layout change**: "Are you moving any walls or relocating fixtures, or keeping everything where it is?" — picks: keeping layout / minor relocations / moving walls.
3. **Plumbing scope** (if bathroom/kitchen/laundry): "What's happening with the plumbing — keeping all fixtures in place, or moving any drains/supply lines?" — picks: no plumbing changes / new fixtures, same locations / relocating plumbing.
4. **Electrical scope** (any reno): "Electrical scope — fixture swaps only, adding new circuits, or moving the panel?" — picks accordingly.
5. **Sub-type specifics** (bathroom-only): tub vs shower? combo or separate? walls type if pre-1980 house.
6. **Structural** (if walls moving): load-bearing concerns?

DIY vs hire question comes AFTER scope is established — for each trade in scope, ask DIY/hire/unsure.

STYLE:
- Conversational, short. ONE question per turn.
- Warm, a little funny, never condescending.
- Why-first copy: one-line reason BEFORE the ask. Bad: "Are you the homeowner?" Good: "In most US states, homeowners can pull their own permits on their primary residence. Is this your full-time home?"
- USE quick-pick \`options\` when the answer space is small (yes/no, scope toggles, skill 1-5).
- If the user's reply doesn't answer your question, say so explicitly ("Didn't quite catch that — to rephrase: ..."). Never silently re-ask.
- If the user mentions a side build ("vanity"), capture in detected_sub_projects and keep going — don't derail.
- If skip_permits, honor it. Mention resale risk ONCE gently, drop it.

PROFILE-AWARE: If the context block has saved defaults (AHJ, currency, residence), skip those questions unless the project is somewhere else.

CURRENCY: USD default; phrase budgets with $.

WRAP (when is_complete = true):
- Reply something like: "Got it — anything else you'd like included before I draft the plan?"
- Set progress.recap = a single warm sentence summarizing what you captured.
- This is the ONLY recap. Nowhere else.

STRUCTURE OF EACH RESPONSE (JSON):
- reply: the next question only, with its why-preamble inline. Short. DO NOT prepend the recap.
- options: optional array of quick picks { label, value } when applicable.
- intake_patch_json: a JSON-stringified object of ONLY fields you learned this turn (e.g. '{"project_goal":"...","location":{"city":"Portland"}}'). Send '{}' if nothing learned.
- progress: { captured_count, estimated_total (5 for craft/decor, 7 for furniture, 10+ for reno), recap }
- is_complete: true on the wrap turn.
- detected_sub_projects: side builds mentioned this turn.
- suggested_parent_link: if context lists user's other projects and the reply references one (e.g. "this vanity is for my bathroom remodel"), surface it here with {parent_project_id, parent_project_name, reason}.
- needs_clarification: true if you couldn't parse the last reply.

${INTAKE_FIELDS_DOC}

Remember: conversational, BRANCHED, right-sized for the project type. Don't be a form.`;

const RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    reply: { type: "string" as const },
    options: {
      type: ["array", "null"] as const,
      items: {
        type: "object" as const,
        properties: {
          label: { type: "string" as const },
          value: { type: "string" as const },
        },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
    intake_patch_json: {
      type: "string" as const,
      description:
        "JSON-encoded object of ONLY the intake fields you learned this turn. Server parses this. Example: '{\"project_goal\":\"bathroom gut\",\"location\":{\"city\":\"Portland\"}}'. Send '{}' if nothing was learned.",
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
    suggested_parent_link: {
      type: ["object", "null"] as const,
      properties: {
        parent_project_id: { type: "string" as const },
        parent_project_name: { type: "string" as const },
        reason: { type: "string" as const },
      },
      required: ["parent_project_id", "parent_project_name", "reason"],
      additionalProperties: false,
    },
    needs_clarification: { type: "boolean" as const },
  },
  required: [
    "reply",
    "intake_patch_json",
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

  // Confirm ownership + pull existing project context so the AI doesn't
  // re-ask things the user already entered on the New Project form.
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, category, budget_total, description, status")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Load profile defaults so we can skip "asked before" questions
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "default_ahj_city, default_ahj_county, default_ahj_state, default_ahj_country, default_currency, is_primary_residence_default"
    )
    .eq("id", user.id)
    .single();

  const profileDefaults = profile
    ? {
        ahj_city: profile.default_ahj_city,
        ahj_county: profile.default_ahj_county,
        ahj_state: profile.default_ahj_state,
        ahj_country: profile.default_ahj_country,
        currency: profile.default_currency,
        is_primary_residence: profile.is_primary_residence_default,
      }
    : undefined;

  // Other active projects for parent-project detection
  const { data: otherProjects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .neq("id", projectId)
    .limit(50);

  // Toolbox inventory — so the intake can reference tools the user owns
  // (and stop asking "what tools do you have" in the first place).
  const { data: toolbox } = await supabase
    .from("toolbox_items")
    .select("id, name, category")
    .eq("user_id", user.id);

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
      userProjects: otherProjects ?? [],
      profileDefaults,
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
      options: mock.options ?? null,
      intake: merged,
      progress: mock.progress,
      is_complete: mock.is_complete,
      detected_sub_projects: mock.detected_sub_projects,
      suggested_parent_link: mock.suggested_parent_link ?? null,
      needs_clarification: mock.needs_clarification === true,
      mock: true,
    });
  }

  // Prepend a system context message that tells the AI what's already captured
  // Build the "already known" view so the AI never re-asks these things.
  const alreadyKnown: Record<string, unknown> = {
    project_name: project.name,
  };
  if (project.category) alreadyKnown.category = project.category;
  if (project.budget_total != null) alreadyKnown.budget_total = project.budget_total;
  if (project.description) alreadyKnown.description = project.description;
  // Merge captured intake on top
  Object.assign(alreadyKnown, intakeSoFar ?? {});

  const contextBlock = `ALREADY KNOWN (do NOT re-ask any of these — treat as pre-captured intake):
${JSON.stringify(alreadyKnown, null, 2)}

USER PROFILE DEFAULTS (also pre-captured — skip these questions unless the user indicates the project is at a different location or in a different context):
${JSON.stringify(profileDefaults ?? {}, null, 2)}

OTHER PROJECTS OWNED BY THIS USER (for suggested_parent_link detection — if the user references one during this project's intake, surface it):
${JSON.stringify((otherProjects ?? []).map((p) => ({ id: p.id, name: p.name })), null, 2)}

USER TOOLBOX INVENTORY (tools they already own — never ask them to list their tools; plan-time will mark new tools with need_to_buy=true):
${JSON.stringify((toolbox ?? []).map((t) => ({ name: t.name, category: t.category })), null, 2)}

If the chat messages below are empty, this is the FIRST turn. Open with ONE warm question — usually "what are you building, and why?" — that references the project name. Do NOT ask two things. Do NOT recap (no recap until is_complete=true).`;

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

    const parsed = parseStructuredResponse<{
      reply: string;
      options?: { label: string; value: string }[];
      intake_patch_json?: string;
      progress: { captured_count: number; estimated_total: number; recap: string | null };
      is_complete: boolean;
      detected_sub_projects?: { title: string; reason_it_came_up: string }[];
      suggested_parent_link?: { parent_project_id: string; parent_project_name: string; reason: string };
      needs_clarification?: boolean;
    }>(response, "intake");

    // Decode the JSON-stringified patch from the AI. Fall back to empty
    // if the AI returns something malformed.
    let intakePatch: Record<string, unknown> = {};
    if (typeof parsed.intake_patch_json === "string" && parsed.intake_patch_json.trim()) {
      try {
        const decoded = JSON.parse(parsed.intake_patch_json);
        if (decoded && typeof decoded === "object") {
          intakePatch = decoded as Record<string, unknown>;
        }
      } catch {
        console.warn("intake_patch_json was not valid JSON; ignoring this turn's patch.");
      }
    }

    // Merge the intake patch into what's stored on the project.
    const merged: Record<string, unknown> = {
      ...(intakeSoFar ?? {}),
      ...intakePatch,
    };
    // Deep-merge the "specifics" and "location" sub-objects so partial updates
    // don't wipe prior fields.
    for (const key of ["specifics", "location"] as const) {
      if (
        intakePatch[key] &&
        typeof intakePatch[key] === "object" &&
        intakeSoFar?.[key] &&
        typeof intakeSoFar[key] === "object"
      ) {
        merged[key] = {
          ...(intakeSoFar[key] as Record<string, unknown>),
          ...(intakePatch[key] as Record<string, unknown>),
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
      options: parsed.options ?? null,
      intake: merged,
      progress: parsed.progress,
      is_complete: parsed.is_complete,
      detected_sub_projects: parsed.detected_sub_projects ?? [],
      suggested_parent_link: parsed.suggested_parent_link ?? null,
      needs_clarification: parsed.needs_clarification === true,
    });
  } catch (error) {
    console.error("Intake error:", error);
    return Response.json(
      { error: "Intake hiccup — try sending that again." },
      { status: 500 }
    );
  }
}
