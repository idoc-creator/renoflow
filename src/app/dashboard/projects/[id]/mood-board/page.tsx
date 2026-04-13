import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MoodBoardClient } from "./mood-board-client";
import type { Tier } from "@/lib/tier";

export default async function MoodBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify project exists and get user tier
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch subscription tier
  let tier: Tier = "free";
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", project.user_id)
    .single();

  if (profile?.subscription_tier) {
    tier = profile.subscription_tier as Tier;
  }

  // Fetch mood board items
  const { data: items } = await supabase
    .from("mood_board_items")
    .select("*")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  return <MoodBoardClient projectId={id} initialItems={items || []} tier={tier} />;
}
