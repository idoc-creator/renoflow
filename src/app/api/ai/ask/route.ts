import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Bench, a helpful assistant for DIY makers working on real projects. You answer questions about home renovation, woodworking, crafts, and general making.

Rules:
- Be concise and practical. Aim for 2-4 short paragraphs max.
- For electrical, plumbing, structural, or gas work, always note when a licensed pro is recommended for safety or code compliance.
- If you're not sure, say so. Don't guess on safety-critical things.
- When relevant, suggest specific products, tools, or techniques by name.
- Focus on actionable advice the maker can use right now.
- Never reference "as an AI" — just answer like a knowledgeable friend.`;

export async function POST(request: Request) {
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
  const { question, context } = body as {
    question: string;
    context?: { projectId?: string; projectCategory?: string };
  };

  if (!question || typeof question !== "string") {
    return new Response(JSON.stringify({ error: "Question required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build user message with optional context
  let userMessage = question;
  if (context?.projectCategory) {
    userMessage = `I'm working on a ${context.projectCategory} project. ${question}`;
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response");
    }

    return Response.json({ answer: textBlock.text });
  } catch (error) {
    console.error("Ask Bench error:", error);
    return Response.json(
      { error: "Failed to get answer. Try again." },
      { status: 500 }
    );
  }
}
