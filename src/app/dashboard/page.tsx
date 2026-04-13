import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FiPlus, FiFolder } from "react-icons/fi";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's projects (will be empty until projects table exists)
  let projects: { id: string; name: string; updated_at: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from("projects")
      .select("id, name, updated_at")
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
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <FiPlus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Projects grid or empty state */}
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="flex flex-col rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                <FiFolder className="h-5 w-5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{project.name}</h3>
              <p className="mt-1 text-xs text-slate-400">
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
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <FiFolder className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">
            No projects yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Start your first renovation plan!
          </p>
          <Link
            href="/dashboard/projects/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <FiPlus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      )}
    </div>
  );
}
