import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Generate shopping list items from the structured materials on each step.
 *
 * - Deduplicates across steps by (lowercased name + unit), summing quantity
 *   and carrying the first non-null estimated_price.
 * - Attributes each generated row to the FIRST stage that needed it (so
 *   the shopping list groups under the earliest stage that requires it).
 * - Skips items already on the shopping list (matched by lowercased name
 *   + unit), so running this twice is idempotent.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (projError || !project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch stages + steps with materials
  const { data: stages } = await supabase
    .from("stages")
    .select("id, title, sort_order, steps(id, title, materials_needed)")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (!stages || stages.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Fetch existing shopping list items so we can skip duplicates
  const { data: existing } = await supabase
    .from("shopping_list_items")
    .select("name, unit")
    .eq("project_id", projectId);

  const existingKeys = new Set(
    (existing ?? []).map(
      (e) =>
        `${(e.name ?? "").trim().toLowerCase()}::${(e.unit ?? "").trim().toLowerCase()}`
    )
  );

  // Aggregate materials across ALL steps
  interface AggregatedMat {
    name: string;
    quantity: number | null;
    unit: string | null;
    estimated_price: number | null;
    first_stage_id: string;
  }
  const agg = new Map<string, AggregatedMat>();

  for (const stage of stages) {
    const steps = (stage.steps || []) as {
      id: string;
      title: string;
      materials_needed: unknown;
    }[];

    for (const step of steps) {
      const materials = step.materials_needed;
      if (!Array.isArray(materials)) continue;

      for (const mat of materials) {
        let name = "";
        let quantity: number | null = null;
        let unit: string | null = null;
        let price: number | null = null;

        if (typeof mat === "string") {
          name = mat.trim();
        } else if (typeof mat === "object" && mat !== null) {
          const m = mat as Record<string, unknown>;
          name = String(m.name || m.item || "").trim();
          if (typeof m.quantity === "number") quantity = m.quantity;
          else if (typeof m.quantity === "string" && m.quantity) {
            const parsed = parseFloat(m.quantity);
            if (!Number.isNaN(parsed)) quantity = parsed;
          }
          if (typeof m.unit === "string" && m.unit.trim())
            unit = m.unit.trim().toLowerCase();
          if (typeof m.estimated_price === "number")
            price = m.estimated_price;
          else if (typeof m.price === "number") price = m.price;
        }

        if (!name) continue;

        const key = `${name.toLowerCase()}::${unit ?? ""}`;
        const existingAgg = agg.get(key);
        if (existingAgg) {
          existingAgg.quantity =
            existingAgg.quantity != null || quantity != null
              ? (existingAgg.quantity ?? 0) + (quantity ?? 0)
              : null;
          if (existingAgg.estimated_price == null && price != null)
            existingAgg.estimated_price = price;
        } else {
          agg.set(key, {
            name,
            quantity,
            unit,
            estimated_price: price,
            first_stage_id: stage.id,
          });
        }
      }
    }
  }

  // Build insert rows, skipping anything already on the shopping list
  const itemsToInsert = Array.from(agg.entries())
    .filter(([key]) => !existingKeys.has(key))
    .map(([, m]) => ({
      project_id: projectId,
      stage_id: m.first_stage_id,
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      estimated_price: m.estimated_price,
    }));

  if (itemsToInsert.length === 0) {
    return NextResponse.json({ items: [], skipped_existing: true });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("shopping_list_items")
    .insert(itemsToInsert)
    .select("*");

  if (insertError) {
    console.error("Shopping list generation error:", insertError);
    return NextResponse.json(
      { error: "Failed to generate shopping list" },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: inserted || [] });
}
