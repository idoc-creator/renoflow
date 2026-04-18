import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProjectOverview, {
  type AggregatedMaterial,
} from "@/components/project/ProjectOverview";

interface StepTool {
  name?: string;
  need_to_buy?: boolean;
}

interface MaterialRow {
  name?: string;
  quantity?: number | string | null;
  unit?: string | null;
  estimated_price?: number | null;
}


export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, name, description, category, cover_image_url, budget_total, budget_spent, contractor_estimate, diy_estimate, status"
    )
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Stages + steps with the jsonb fields we need for aggregation
  const { data: stages } = await supabase
    .from("stages")
    .select(
      "id, linked_project_id, steps(id, is_completed, step_tools, tools_needed, materials_needed)"
    )
    .eq("project_id", id);

  const stageCount = stages?.length ?? 0;

  // Aggregate steps
  type Step = {
    id: string;
    is_completed: boolean;
    step_tools: StepTool[] | null;
    tools_needed: string[] | null;
    materials_needed: MaterialRow[] | null;
  };
  const allSteps: Step[] = (stages ?? []).flatMap(
    (s) => (s.steps as Step[]) ?? []
  );
  const stepCount = allSteps.length;
  const completedStepCount = allSteps.filter((s) => s.is_completed).length;

  // Sub-projects
  const subProjectCount = (stages ?? []).filter(
    (s) => s.linked_project_id
  ).length;

  // Upcoming "order by" items (not yet purchased, date within 14 days or past)
  const { data: upcomingOrders } = await supabase
    .from("shopping_list_items")
    .select("id, name, order_by_date, is_purchased")
    .eq("project_id", id)
    .eq("is_purchased", false)
    .not("order_by_date", "is", null)
    .order("order_by_date", { ascending: true })
    .limit(10);
  const todayMs = Date.now();
  const horizonMs = todayMs + 14 * 86_400_000;
  const orderSoon = (upcomingOrders ?? []).filter((item) => {
    if (!item.order_by_date) return false;
    const t = new Date(item.order_by_date + "T00:00:00").getTime();
    return t <= horizonMs;
  });

  // Milestones summary (open = not complete)
  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("id, title, kind, status, due_date")
    .eq("project_id", id);
  const openMilestones = (milestones ?? []).filter(
    (m) => m.status !== "complete"
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextMilestone = openMilestones
    .filter((m) => m.due_date)
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))[0];
  const overdueMilestoneCount = openMilestones.filter((m) => {
    if (!m.due_date) return false;
    return new Date(m.due_date + "T00:00:00") < today;
  }).length;

  // Dedupe tools by lowercased name; keep the "nicer" label (first seen)
  // and mark need_to_buy if any occurrence says so.
  const toolMap = new Map<string, { name: string; need_to_buy: boolean }>();
  for (const step of allSteps) {
    const fromStepTools = Array.isArray(step.step_tools) ? step.step_tools : [];
    for (const t of fromStepTools) {
      const name = (t?.name || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const existing = toolMap.get(key);
      toolMap.set(key, {
        name: existing?.name ?? name,
        need_to_buy: Boolean(existing?.need_to_buy) || Boolean(t?.need_to_buy),
      });
    }
    const fromToolsNeeded = Array.isArray(step.tools_needed)
      ? step.tools_needed
      : [];
    for (const t of fromToolsNeeded) {
      const name = (t || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!toolMap.has(key)) {
        toolMap.set(key, { name, need_to_buy: false });
      }
    }
  }
  const tools = Array.from(toolMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Aggregate materials: dedupe by lowercased (name + unit); sum quantity
  // and total estimated cost when present.
  const materialMap = new Map<string, AggregatedMaterial>();
  for (const step of allSteps) {
    const mats = Array.isArray(step.materials_needed)
      ? step.materials_needed
      : [];
    for (const m of mats) {
      const name = (m?.name || "").trim();
      if (!name) continue;
      const unit = (m?.unit || "").trim().toLowerCase() || null;
      const key = `${name.toLowerCase()}::${unit ?? ""}`;
      const qty =
        m?.quantity != null && m.quantity !== ""
          ? Number(m.quantity)
          : null;
      const price =
        m?.estimated_price != null ? Number(m.estimated_price) : null;
      const lineTotal = qty != null && price != null ? qty * price : null;
      const existing = materialMap.get(key);
      if (existing) {
        existing.quantity =
          existing.quantity != null || qty != null
            ? (existing.quantity ?? 0) + (qty ?? 0)
            : null;
        existing.step_count += 1;
        existing.total_estimated =
          existing.total_estimated != null || lineTotal != null
            ? (existing.total_estimated ?? 0) + (lineTotal ?? 0)
            : null;
      } else {
        materialMap.set(key, {
          name,
          unit,
          quantity: qty,
          step_count: 1,
          total_estimated: lineTotal,
        });
      }
    }
  }
  const materials = Array.from(materialMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <ProjectOverview
      project={project}
      stageCount={stageCount}
      stepCount={stepCount}
      completedStepCount={completedStepCount}
      subProjectCount={subProjectCount}
      tools={tools}
      materials={materials}
      openMilestoneCount={openMilestones.length}
      overdueMilestoneCount={overdueMilestoneCount}
      nextMilestone={
        nextMilestone
          ? {
              title: nextMilestone.title,
              kind: nextMilestone.kind as string,
              due_date: nextMilestone.due_date,
            }
          : null
      }
      orderSoon={orderSoon.map((o) => ({
        id: o.id,
        name: o.name,
        order_by_date: o.order_by_date,
      }))}
    />
  );
}
