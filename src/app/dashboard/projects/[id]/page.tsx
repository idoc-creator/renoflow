import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch stages with their steps
  const { data: stages } = await supabase
    .from("stages")
    .select("*, steps(*)")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  // Sort steps within each stage
  const sortedStages = (stages || []).map((stage) => ({
    ...stage,
    steps: (stage.steps || []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
  }));

  const savings =
    (project.contractor_estimate || 0) - (project.diy_estimate || 0);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <FiArrowLeft className="h-4 w-4" />
        All Projects
      </Link>

      {/* Project header */}
      <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>

      {/* Summary */}
      {project.summary && (
        <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-slate-700 leading-relaxed">{project.summary}</p>
        </div>
      )}

      {/* Cost overview */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FiDollarSign className="h-4 w-4" />
            DIY Estimate
          </div>
          <p className="mt-1 text-xl font-bold text-teal-700">
            ${(project.diy_estimate || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FiDollarSign className="h-4 w-4" />
            Contractor Would Charge
          </div>
          <p className="mt-1 text-xl font-bold text-slate-600">
            ${(project.contractor_estimate || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <FiCheckCircle className="h-4 w-4" />
            You Save
          </div>
          <p className="mt-1 text-xl font-bold text-amber-700">
            ${savings.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Stages */}
      <div className="mt-8 space-y-4 pb-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Your Plan ({sortedStages.length} stages)
        </h2>

        {sortedStages.map(
          (
            stage: {
              id: string;
              title: string;
              description: string;
              reason: string;
              estimated_cost: number;
              estimated_hours: number;
              steps: {
                id: string;
                title: string;
                description: string;
                skill_level: string;
                estimated_minutes: number;
                tools_needed: string[];
              }[];
            },
            idx: number
          ) => (
            <div key={stage.id} className="rounded-xl bg-white shadow-sm">
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900">
                    {stage.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {stage.description}
                </p>

                <div className="mt-3 flex gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FiDollarSign className="h-3 w-3" />$
                    {stage.estimated_cost.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="h-3 w-3" />
                    {stage.estimated_hours}h
                  </span>
                </div>

                {stage.reason && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Why this order
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {stage.reason}
                    </p>
                  </div>
                )}

                {/* Steps */}
                {stage.steps.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {stage.steps.map(
                      (
                        step: {
                          id: string;
                          title: string;
                          description: string;
                          skill_level: string;
                          estimated_minutes: number;
                          tools_needed: string[];
                        },
                        sIdx: number
                      ) => (
                        <div
                          key={step.id}
                          className="flex gap-3 rounded-lg border border-slate-100 p-3"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                            {sIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-800">
                              {step.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {step.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  step.skill_level === "beginner"
                                    ? "bg-green-50 text-green-700"
                                    : step.skill_level === "intermediate"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-red-50 text-red-700"
                                }`}
                              >
                                {step.skill_level}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ~{step.estimated_minutes} min
                              </span>
                            </div>
                            {step.tools_needed?.length > 0 && (
                              <p className="mt-1 text-[10px] text-slate-400">
                                Tools: {step.tools_needed.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
