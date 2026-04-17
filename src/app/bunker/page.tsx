import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FiPlus, FiFolder, FiAlertCircle } from "react-icons/fi";
import { NewProjectButton } from "@/components/NewProjectButton";
import { type ProjectCardData } from "@/components/bunker/ProjectCard";
import { ProjectGrid } from "@/components/bunker/ProjectGrid";

export default async function BunkerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cards: ProjectCardData[] = [];
  let errorMsg: string | null = null;

  if (user) {
    // Step 1: fetch the projects themselves
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(
        "id, name, updated_at, cover_image_url, category, status, description"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (projectsError) {
      console.error("Bunker: failed to load projects", projectsError);
      errorMsg = projectsError.message;
    }

    const projectList = projects ?? [];
    const projectIds = projectList.map((p) => p.id);

    // Step 2: fetch stages for those projects (separate query — if this fails,
    // we still show the cards with zeroed counts rather than an empty page)
    let stagesByProject = new Map<
      string,
      { id: string; linked_project_id: string | null }[]
    >();
    let stepsByStage = new Map<string, { is_completed: boolean }[]>();

    if (projectIds.length > 0) {
      const { data: stages, error: stagesError } = await supabase
        .from("stages")
        .select("id, project_id, linked_project_id")
        .in("project_id", projectIds);

      if (stagesError) {
        console.error("Bunker: failed to load stages", stagesError);
      }
      const stageRows = stages ?? [];
      for (const s of stageRows) {
        const list = stagesByProject.get(s.project_id) ?? [];
        list.push({ id: s.id, linked_project_id: s.linked_project_id });
        stagesByProject.set(s.project_id, list);
      }

      const stageIds = stageRows.map((s) => s.id);
      if (stageIds.length > 0) {
        const { data: steps, error: stepsError } = await supabase
          .from("steps")
          .select("stage_id, is_completed")
          .in("stage_id", stageIds);
        if (stepsError) {
          console.error("Bunker: failed to load steps", stepsError);
        }
        for (const st of steps ?? []) {
          const list = stepsByStage.get(st.stage_id) ?? [];
          list.push({ is_completed: st.is_completed });
          stepsByStage.set(st.stage_id, list);
        }
      }
    }

    // Build child→parent lookup from any stage that links elsewhere
    const parentByChildId = new Map<string, { id: string; name: string }>();
    for (const p of projectList) {
      for (const s of stagesByProject.get(p.id) ?? []) {
        if (s.linked_project_id) {
          parentByChildId.set(s.linked_project_id, { id: p.id, name: p.name });
        }
      }
    }

    cards = projectList.map((p) => {
      const stages = stagesByProject.get(p.id) ?? [];
      const stageCount = stages.length;
      let stepCount = 0;
      let completedStepCount = 0;
      let subProjectCount = 0;
      for (const s of stages) {
        if (s.linked_project_id) subProjectCount += 1;
        for (const step of stepsByStage.get(s.id) ?? []) {
          stepCount += 1;
          if (step.is_completed) completedStepCount += 1;
        }
      }
      return {
        id: p.id,
        name: p.name,
        updated_at: p.updated_at,
        cover_image_url: p.cover_image_url,
        category: p.category,
        status: p.status,
        description: p.description,
        stageCount,
        stepCount,
        completedStepCount,
        subProjectCount,
        parentProject: parentByChildId.get(p.id) ?? null,
      };
    });
  }

  return (
    <div>
      {/* Header — editorial treatment with a caps-label kicker */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-caption uppercase tracking-[0.18em] text-walnut">
            Your Bunker
          </p>
          <h1 className="font-display-lg text-ink mt-1">Projects</h1>
        </div>
        <NewProjectButton />
      </div>

      {errorMsg && (
        <div className="mb-4 inline-flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          <FiAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Couldn&apos;t load projects</p>
            <p className="opacity-80">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Projects grid or empty state */}
      {cards.length > 0 ? (
        <ProjectGrid cards={cards} />
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
