import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FiPlus, FiFolder } from "react-icons/fi";
import { NewProjectButton } from "@/components/NewProjectButton";

export default async function BunkerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let projects: { id: string; name: string; updated_at: string; cover_image_url: string | null }[] = [];

  if (user) {
    const { data } = await supabase
      .from("projects")
      .select("id, name, updated_at, cover_image_url")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) {
      projects = data;
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Your Bunker</h1>
        <NewProjectButton />
      </div>

      {/* Projects grid or empty state */}
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/bunker/project/${project.id}`}
              className="flex flex-col rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sage/10">
                <FiFolder className="h-5 w-5 text-sage" />
              </div>
              <h3 className="font-semibold text-charcoal">{project.name}</h3>
              <p className="mt-1 text-xs text-warm-gray">
                Updated{" "}
                {new Date(project.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-warm bg-white py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
            <FiFolder className="h-7 w-7 text-warm-gray" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal">
            No projects yet
          </h3>
          <p className="mt-1 text-sm text-warm-gray">
            Start your first renovation plan!
          </p>
          <Link
            href="/bunker/project/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sage px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
          >
            <FiPlus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      )}
    </div>
  );
}
