import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return Response.json({ results: [] });
  }

  // Use trigram similarity search for fuzzy matching
  const { data, error } = await supabase
    .from("catalog_entries")
    .select(
      "id, name, category, make, model, description, avg_price, typical_consumables, manual_url"
    )
    .or(`name.ilike.%${q}%,make.ilike.%${q}%`)
    .order("is_verified", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Catalog search error:", error);
    return Response.json({ results: [] });
  }

  return Response.json({ results: data ?? [] });
}
