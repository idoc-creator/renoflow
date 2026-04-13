import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  // Verify project belongs to user
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (projError || !project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch stages and steps with materials_needed
  const { data: stages } = await supabase
    .from("stages")
    .select("id, title, sort_order, steps(id, title, materials_needed)")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (!stages || stages.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Extract materials from steps and build shopping list items
  const itemsToInsert: {
    project_id: string;
    stage_id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    estimated_price: number | null;
  }[] = [];

  for (const stage of stages) {
    const steps = (stage.steps || []) as {
      id: string;
      title: string;
      materials_needed: unknown;
    }[];

    for (const step of steps) {
      const materials = step.materials_needed;
      if (!materials || !Array.isArray(materials)) continue;

      for (const mat of materials) {
        if (typeof mat === "string") {
          // Simple string material
          itemsToInsert.push({
            project_id: projectId,
            stage_id: stage.id,
            name: mat,
            quantity: 1,
            unit: null,
            estimated_price: null,
          });
        } else if (typeof mat === "object" && mat !== null) {
          // Object with name, quantity, unit, estimated_price
          const m = mat as Record<string, unknown>;
          itemsToInsert.push({
            project_id: projectId,
            stage_id: stage.id,
            name: String(m.name || m.item || "Unknown item"),
            quantity: typeof m.quantity === "number" ? m.quantity : 1,
            unit: typeof m.unit === "string" ? m.unit : null,
            estimated_price:
              typeof m.estimated_price === "number"
                ? m.estimated_price
                : typeof m.price === "number"
                  ? m.price
                  : null,
          });
        }
      }
    }
  }

  if (itemsToInsert.length === 0) {
    return NextResponse.json({ items: [] });
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
