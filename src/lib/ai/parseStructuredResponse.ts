import type Anthropic from "@anthropic-ai/sdk";

/**
 * Robust JSON extraction from a Claude structured-output response.
 *
 * The Anthropic SDK returns content as an array of typed blocks. With
 * `output_config.format = { type: "json_schema", ... }` the model is
 * supposed to return a single TextBlock containing valid JSON. In
 * practice we sometimes see:
 *   - thinking blocks alongside the text block
 *   - the response truncating mid-output if max_tokens is exceeded
 *   - the text block containing the JSON wrapped in markdown code fences
 *   - a stop_reason of "max_tokens" with a partial JSON
 *
 * This helper handles all those cases. On failure it logs the response
 * shape (so we can debug what came back) and throws a clear error that
 * the route can surface to the user.
 */
export function parseStructuredResponse<T = unknown>(
  response: Anthropic.Message,
  context: string
): T {
  // Find the first text block. There may also be thinking blocks before it.
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );

  if (textBlocks.length === 0) {
    const blockTypes = response.content.map((b) => b.type).join(", ");
    console.error(
      `[${context}] No text block in response. Got: [${blockTypes}]. stop_reason=${response.stop_reason}`
    );
    throw new Error(
      response.stop_reason === "max_tokens"
        ? "Response was cut off — try a smaller request"
        : "AI response had no text content"
    );
  }

  // Concatenate all text blocks (sometimes there's thinking + text + more)
  let raw = textBlocks.map((b) => b.text).join("").trim();

  // Strip markdown code fences if present (```json ... ```)
  const fenceMatch = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) raw = fenceMatch[1];

  // Truncated JSON? Try to recover by trimming to the last balanced brace.
  if (response.stop_reason === "max_tokens" && !isLikelyCompleteJson(raw)) {
    const recovered = trimToLastBalancedBrace(raw);
    if (recovered) raw = recovered;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(
      `[${context}] JSON parse failed. stop_reason=${response.stop_reason}. First 500 chars:`,
      raw.substring(0, 500)
    );
    throw new Error(
      `AI response wasn't valid JSON (${e instanceof Error ? e.message : "unknown"})`
    );
  }
}

function isLikelyCompleteJson(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  );
}

function trimToLastBalancedBrace(s: string): string | null {
  // Walk forward, track brace + bracket depth + whether inside a string.
  // Return the substring up to the position where depth returns to 0.
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastBalancedEnd = -1;
  const open = s[0];
  if (open !== "{" && open !== "[") return null;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) lastBalancedEnd = i;
    }
  }
  if (lastBalancedEnd === -1) return null;
  return s.substring(0, lastBalancedEnd + 1);
}
