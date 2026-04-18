import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

const IDENTIFY_SCHEMA = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const, description: "Tool name, e.g. Circular Saw" },
    make: { type: "string" as const, description: "Brand/manufacturer, e.g. DeWalt" },
    model: { type: "string" as const, description: "Model number if visible" },
    category: {
      type: "string" as const,
      enum: ["hand_tool", "power_tool", "ppe", "measuring", "other"],
    },
    confidence: {
      type: "string" as const,
      enum: ["high", "medium", "low"],
    },
  },
  required: ["name", "category", "confidence"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const client = getAnthropicClient();
  if (!client) {
    return Response.json(
      { error: "Photo identification unavailable — ANTHROPIC_API_KEY not set." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { imageBase64, mediaType } = body as {
    imageBase64: string;
    mediaType: string;
  };

  if (!imageBase64) {
    return Response.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      output_config: {
        format: {
          type: "json_schema",
          schema: IDENTIFY_SCHEMA,
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: (mediaType || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Identify this tool or piece of equipment. Return the tool name, brand/make if visible, model number if visible, and category. Be specific — don't say 'power tool', say 'circular saw' or 'reciprocating saw'.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No response");
    return Response.json(JSON.parse(textBlock.text));
  } catch (error) {
    console.error("Identify tool error:", error);
    return Response.json(
      { error: "Couldn't identify the tool. Try a clearer photo or add manually." },
      { status: 500 }
    );
  }
}
