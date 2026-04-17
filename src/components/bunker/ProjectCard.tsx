"use client";

import Link from "next/link";
import {
  FiClipboard,
  FiDollarSign,
  FiTool,
  FiPackage,
  FiImage,
  FiHome,
  FiScissors,
  FiSun,
  FiFolder,
  FiLink,
  FiLayers,
} from "react-icons/fi";

export interface ProjectCardData {
  id: string;
  name: string;
  updated_at: string;
  cover_image_url: string | null;
  category: string | null;
  status: string;
  description: string | null;
  stageCount: number;
  stepCount: number;
  completedStepCount: number;
  subProjectCount: number;
  /** Set if this project is itself a sub-project of another. */
  parentProject?: { id: string; name: string } | null;
}

const CATEGORY_META: Record<
  string,
  {
    label: string;
    icon: typeof FiHome;
    gradient: string;
    accent: string;
  }
> = {
  renovation: {
    label: "Renovation",
    icon: FiHome,
    gradient: "from-terracotta/20 to-terracotta/5",
    accent: "text-terracotta-dark",
  },
  furniture: {
    label: "Furniture",
    icon: FiLayers,
    gradient: "from-sage/20 to-sage/5",
    accent: "text-sage-dark",
  },
  craft: {
    label: "Craft",
    icon: FiScissors,
    gradient: "from-amber-200/40 to-amber-50",
    accent: "text-amber-800",
  },
  decor: {
    label: "Decor",
    icon: FiImage,
    gradient: "from-pink-200/40 to-pink-50",
    accent: "text-pink-800",
  },
  outdoor: {
    label: "Outdoor",
    icon: FiSun,
    gradient: "from-blue-200/40 to-blue-50",
    accent: "text-blue-800",
  },
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  planning: { text: "Planning", cls: "bg-cream text-warm-gray" },
  in_progress: { text: "In progress", cls: "bg-sage/20 text-sage-dark" },
  completed: { text: "Complete", cls: "bg-green-100 text-green-700" },
  paused: { text: "Paused", cls: "bg-amber-50 text-amber-800" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const catKey = (project.category || "other").toLowerCase();
  const meta = CATEGORY_META[catKey];
  const CategoryIcon = meta?.icon ?? FiFolder;
  const status = STATUS_LABEL[project.status] ?? STATUS_LABEL.planning;
  const progressPct =
    project.stepCount > 0
      ? Math.round((project.completedStepCount / project.stepCount) * 100)
      : 0;

  return (
    <Link
      href={`/bunker/project/${project.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-terracotta"
    >
      {/* Cover area — image if present, else gradient + category icon */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {project.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${meta?.gradient ?? "from-cream to-border-warm"}`}
          >
            <CategoryIcon
              className={`h-14 w-14 ${meta?.accent ?? "text-warm-gray"} opacity-60`}
            />
          </div>
        )}

        {/* Parent-project chip (top-left) */}
        {project.parentProject && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-terracotta-dark shadow-sm">
            <FiLink className="h-3 w-3" />
            Part of {project.parentProject.name}
          </div>
        )}

        {/* Status pill (top-right) */}
        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${status.cls}`}
          >
            {status.text}
          </span>
        </div>

        {/* Hover overlay — only meaningful when we have an image.
            On no-image cards the info is already visible below, but
            this overlay still appears so the interaction feels the same. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-charcoal/85 via-charcoal/30 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <h3 className="font-serif text-lg text-white drop-shadow">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-xs text-white/85">
              {project.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/90">
            {meta?.label && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 font-medium backdrop-blur-sm">
                {meta.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <FiClipboard className="h-3 w-3" />
              {project.stageCount} stage{project.stageCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <FiTool className="h-3 w-3" />
              {project.completedStepCount}/{project.stepCount} steps
            </span>
            {project.subProjectCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <FiPackage className="h-3 w-3" />
                {project.subProjectCount} sub
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer info — always visible */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-serif text-lg text-charcoal">{project.name}</h3>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-warm-gray">
          {meta?.label && (
            <span className="inline-flex items-center gap-1">
              <CategoryIcon className={`h-3 w-3 ${meta.accent}`} />
              {meta.label}
            </span>
          )}
          <span>·</span>
          <span>Updated {formatDate(project.updated_at)}</span>
        </div>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-xs text-warm-gray">
            {project.description}
          </p>
        )}

        {/* Mini stats row */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[11px] text-warm-gray">
          <span className="inline-flex items-center gap-1">
            <FiClipboard className="h-3 w-3" />
            {project.stageCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiTool className="h-3 w-3" />
            {project.completedStepCount}/{project.stepCount}
          </span>
          {project.subProjectCount > 0 && (
            <span className="inline-flex items-center gap-1 text-terracotta-dark">
              <FiPackage className="h-3 w-3" />
              {project.subProjectCount} sub-project
              {project.subProjectCount === 1 ? "" : "s"}
            </span>
          )}
          {project.stepCount > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 font-medium text-charcoal">
              <FiDollarSign className="h-3 w-3 opacity-0" />
              {progressPct}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {project.stepCount > 0 && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-cream">
            <div
              className="h-full rounded-full bg-sage transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
