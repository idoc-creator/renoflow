import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SavingsDashboard } from "@/components/project/SavingsDashboard";
import { ShoppingListClient } from "@/components/project/ShoppingListClient";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, budget_total, budget_spent, contractor_estimate, diy_estimate, contingency_pct"
    )
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  // Fetch stages for section headers
  const { data: stages } = await supabase
    .from("stages")
    .select("id, title, sort_order, actual_cost")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  // Fetch shopping list items
  const { data: items } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  // Calculate actual_cost total from stages
  const actualCostTotal =
    stages?.reduce((sum, s) => sum + (Number(s.actual_cost) || 0), 0) ?? 0;

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-caption uppercase tracking-[0.18em] text-walnut">
          Savings & Budget
        </p>
        <SavingsDashboard
          contractorEstimate={Number(project.contractor_estimate) || 0}
          diyEstimate={Number(project.diy_estimate) || 0}
          budgetTotal={Number(project.budget_total) || 0}
          budgetSpent={Number(project.budget_spent) || 0}
          actualCostTotal={actualCostTotal}
          contingencyPct={Number(project.contingency_pct) || 15}
        />
      </section>

      <section className="space-y-3">
        <p className="text-caption uppercase tracking-[0.18em] text-walnut">
          Shopping List
        </p>
        <ShoppingListClient
          projectId={id}
          stages={stages ?? []}
          initialItems={items ?? []}
        />
      </section>
    </div>
  );
}
