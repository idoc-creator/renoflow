import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FiPlus, FiFolder } from "react-icons/fi";
import { NewProjectButton } from "@/components/NewProjectButton";
import { ProjectCard, type ProjectCardData } from "@/components/bunker/ProjectCard";

interface RawStage {
  id: string;
  linked_project_id: string | null;
  steps: { id: string; is_completed: boolean }[] | null;
}

interface RawProject {
  id: string;
  name: string;
  updated_at: string;
  cover_image_url: string | null;
  category: string | null;
  status: string;
  description: string | null;
  stages: RawStage[] | null;
}

export default async function BunkerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cards: ProjectCardData[] = [];

  if (user) {
    const { data } = await supabase
      .from("projects")
      .select(
        `
        id, name, updated_at, cover_image_url, category, status, description,
        stages(id, linked_project_id, steps(id, is_completed))
        `
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    const raw = (data ?? []) as RawProject[];

    // Build a map of child-id → parent project, so we can stamp
    // "Part of [parent]" chips on projects that are sub-projects of another.
    const parentByChildId = new Map<string, { id: string; name: string }>();
    for (const p of raw) {
      for (const stage of p.stages ?? []) {
        if (stage.linked_project_id) {
          parentByChildId.set(stage.linked_project_id, {
            id: p.id,
            name: p.name,
          });
        }
      }
    }

    cards = raw.map((p) => {
      const stages = p.stages ?? [];
      const stageCount = stages.length;
      let stepCount = 0;
      let completedStepCount = 0;
      let subProjectCount = 0;
      for (const s of stages) {
        if (s.linked_project_id) subProjectCount += 1;
        for (const step of s.steps ?? []) {
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Your Bunker</h1>
        <NewProjectButton />
      </div>

      {/* Projects grid or empty state */}
      {cards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
