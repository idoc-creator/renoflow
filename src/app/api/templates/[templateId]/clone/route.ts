import { createClient } from "@/lib/supabase/server";
import { createProjectFromPlan } from "@/lib/projects/createFromPlan";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: template, error: fetchError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (fetchError || !template) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  try {
    const projectId = await createProjectFromPlan({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      userId: user.id,
      name: template.title,
      description: template.description,
      category: template.category,
      coverImageUrl: template.cover_image_url,
      clonedFromTemplateId: template.id,
      budgetTotal: template.estimated_cost,
      planData: template.plan_data,
    });

    await supabase
      .from("templates")
      .update({ build_count: (template.build_count || 0) + 1 })
      .eq("id", templateId);

    return Response.json({ projectId });
  } catch (error) {
    console.error("Clone error:", error);
    return Response.json(
      { error: "Failed to clone template" },
      { status: 500 }
    );
  }
}
