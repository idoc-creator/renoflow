import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MasonryGrid from "@/components/browse/MasonryGrid";
import TopNav from "@/components/browse/TopNav";
import CategoryTabs from "@/components/browse/CategoryTabs";

const VALID_CATEGORIES = [
  "renovation",
  "furniture",
  "decor",
  "craft",
  "outdoor",
];

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("templates")
    .select(
      "id, title, cover_image_url, build_count, estimated_cost, difficulty_level"
    )
    .eq("category", category)
    .or("is_published.eq.true,is_seed.eq.true")
    .order("is_featured", { ascending: false })
    .order("build_count", { ascending: false });

  return (
    <div className="min-h-screen">
      <TopNav isAuthed={!!user} />
      <CategoryTabs active={category} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <MasonryGrid templates={templates ?? []} />
      </main>
    </div>
  );
}
