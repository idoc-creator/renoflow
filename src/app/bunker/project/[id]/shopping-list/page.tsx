import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ShoppingListClient } from "./shopping-list-client";

export default async function ShoppingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify project exists
  const { data: project, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch stages for section headers
  const { data: stages } = await supabase
    .from("stages")
    .select("id, title, sort_order")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  // Fetch shopping list items
  const { data: items } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  return (
    <ShoppingListClient
      projectId={id}
      stages={stages || []}
      initialItems={items || []}
    />
  );
}
