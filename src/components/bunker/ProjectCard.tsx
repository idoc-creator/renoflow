"use client";

import Link from "next/link";
import {
  FiClipboard,
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
    gradient: "from-terracotta/30 via-terracotta/10 to-cream",
    accent: "text-terracotta-dark",
  },
  furniture: {
    label: "Furniture",
    icon: FiLayers,
    gradient: "from-sage/30 via-sage/10 to-cream",
    accent: "text-sage-dark",
  },
  craft: {
    label: "Craft",
    icon: FiScissors,
    gradient: "from-amber-200 via-amber-100 to-cream",
    accent: "text-amber-800",
  },
  decor: {
    label: "Decor",
    icon: FiImage,
    gradient: "from-pink-200 via-pink-100 to-cream",
    accent: "text-pink-800",
  },
  outdoor: {
    label: "Outdoor",
    icon: FiSun,
    gradient: "from-blue-200 via-blue-100 to-cream",
    accent: "text-blue-800",
  },
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  planning: { text: "Planning", cls: "bg-white/90 text-warm-gray" },
  in_progress: {
    text: "In progress",
    cls: "bg-sage/90 text-white",
  },
  completed: { text: "Complete", cls: "bg-green-600/90 text-white" },
  paused: { text: "Paused", cls: "bg-amber-500/90 text-white" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Card is image-first and full-bleed. With a photo, you see nothing but the
 * photo (+ status pill + parent chip) until you hover — then an overlay fades
 * in with the details. Without a photo, the card shows a category-tinted
 * gradient with the project name visible by default so it's still scannable.
 *
 * `aspectClass` is passed in so the masonry grid can vary heights per card.
 */
export function ProjectCard({
  project,
  aspectClass = "aspect-[4/5]",
}: {
  project: ProjectCardData;
  aspectClass?: string;
}) {
  const catKey = (project.category || "other").toLowerCase();
  const meta = CATEGORY_META[catKey];
  const CategoryIcon = meta?.icon ?? FiFolder;
  const status = STATUS_LABEL[project.status] ?? STATUS_LABEL.planning;
  const progressPct =
    project.stepCount > 0
      ? Math.round((project.completedStepCount / project.stepCount) * 100)
      : 0;
  const hasImage = !!project.cover_image_url;

  return (
    <Link
      href={`/bunker/project/${project.id}`}
      className={`group relative block w-full overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-terracotta ${aspectClass}`}
    >
      {/* Base layer — photo or gradient */}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.cover_image_url!}
          alt={project.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${meta?.gradient ?? "from-cream to-border-warm"} p-4`}
        >
          <CategoryIcon
            className={`h-16 w-16 ${meta?.accent ?? "text-warm-gray"} opacity-60 mb-3`}
          />
          <p className="text-center font-serif text-xl text-charcoal">
            {project.name}
          </p>
          <p className={`mt-1 text-[11px] font-medium ${meta?.accent ?? "text-warm-gray"}`}>
            {meta?.label ?? "Project"}
          </p>
        </div>
      )}

      {/* Always-visible pills (top) */}
      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        {project.parentProject ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-terracotta-dark shadow-sm max-w-[70%] truncate">
            <FiLink className="h-3 w-3 shrink-0" />
            <span className="truncate">Part of {project.parentProject.name}</span>
          </span>
        ) : (
          <span />
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm shadow-sm ${status.cls}`}
        >
          {status.text}
        </span>
      </div>

      {/* Hover overlay — fades in with all the info */}
      <div
        className={`pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-charcoal/95 via-charcoal/60 to-charcoal/10 p-4 transition-opacity duration-200 ${
          hasImage ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <h3 className="font-serif text-xl text-white drop-shadow-sm leading-tight">
          {project.name}
        </h3>
        {project.description && (
          <p className="mt-1 line-clamp-3 text-xs text-white/85">
            {project.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/90">
          {meta?.label && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-medium backdrop-blur-sm">
              <CategoryIcon className="h-3 w-3" />
              {meta.label}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <FiClipboard className="h-3 w-3" />
            {project.stageCount} stage{project.stageCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiTool className="h-3 w-3" />
            {project.completedStepCount}/{project.stepCount}
          </span>
          {project.subProjectCount > 0 && (
            <span className="inline-flex items-center gap-1 text-terracotta">
              <FiPackage className="h-3 w-3" />
              {project.subProjectCount} sub
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-white/80">
          <span>Updated {formatDate(project.updated_at)}</span>
          {project.stepCount > 0 && (
            <>
              <span>·</span>
              <span className="font-semibold text-white">{progressPct}%</span>
            </>
          )}
        </div>
        {project.stepCount > 0 && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-sage"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
