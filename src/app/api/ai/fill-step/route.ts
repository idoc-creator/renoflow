import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Bench, a DIY coach helping someone plan the details of a single step in their project. They'll give you a step title (and maybe project context). You return practical, specific content they can use immediately.

Return these fields:
- subTasks: 4-10 concrete micro-actions in the order they should be done. Plain, short titles. No numbering.
- tools: 3-8 tools needed, lowercase names. Include hand tools and power tools. Don't include PPE here.
- tips: 2-5 short practical tips and best practices for this specific step. Safety notes, tricks, common mistakes.

Be practical, not generic. Match the user's project context. If the step involves electrical, plumbing, or structural work and the project context suggests the user is a beginner, include a tip about when to call a pro.`;

const FILL_STEP_SCHEMA = {
  type: "object" as const,
  properties: {
    subTasks: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    tools: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    tips: {
      type: "array" as const,
      items: { type: "string" as const },
    },
  },
  required: ["subTasks", "tools", "tips"],
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
  const { stepTitle, projectId, stageTitle } = body as {
    stepTitle: string;
    projectId?: string;
    stageTitle?: string;
  };

  if (!stepTitle || typeof stepTitle !== "string") {
    return Response.json(
      { error: "stepTitle is required" },
      { status: 400 }
    );
  }

  let projectContext = "";
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("name, category, description")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    if (project) {
      projectContext = `Project: ${project.name}${project.category ? ` (${project.category})` : ""}. ${project.description ?? ""}`;
    }
  }

  const userMessage = `Step title: "${stepTitle}"
${stageTitle ? `Stage: ${stageTitle}` : ""}
${projectContext ? projectContext : ""}

Fill in the details for this step.`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: FILL_STEP_SCHEMA,
        },
      },
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response");
    }

    const parsed = JSON.parse(textBlock.text);
    return Response.json(parsed);
  } catch (error) {
    console.error("Fill step error:", error);
    return Response.json(
      { error: "Couldn't rough it in. Try again." },
      { status: 500 }
    );
  }
}
