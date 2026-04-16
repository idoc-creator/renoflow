import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/browse/TopNav";
import ShedClient from "./shed-client";

export default async function ShedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("catalog_entries")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen">
      <TopNav isAuthed={!!user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ShedClient entries={entries ?? []} isAuthed={!!user} />
      </main>
    </div>
  );
}
