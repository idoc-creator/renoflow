import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MoodBoardClient } from "./mood-board-client";

export default async function MoodBoardPage({
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

  // Fetch mood board items
  const { data: items } = await supabase
    .from("mood_board_items")
    .select("*")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  return <MoodBoardClient projectId={id} initialItems={items || []} />;
}
