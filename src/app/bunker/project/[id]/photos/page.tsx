import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FiCamera } from "react-icons/fi";

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl text-charcoal">Photos</h2>

      <div className="rounded-2xl bg-white border-2 border-dashed border-border-warm p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
          <FiCamera className="h-6 w-6 text-warm-gray" />
        </div>
        <h3 className="font-serif text-2xl text-charcoal">
          Before, during, after
        </h3>
        <p className="mt-2 text-sm text-warm-gray max-w-md mx-auto">
          Upload photos as you work. We&apos;ll turn them into share-ready
          before/after gallery shots.
        </p>
        <p className="mt-4 text-xs text-warm-gray italic">
          Photo upload coming soon.
        </p>
      </div>
    </div>
  );
}
