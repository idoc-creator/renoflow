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
    // Honey gradient (warm tan) with walnut icon — keeps renovation warm and
    // visually distinct from furniture (moss green). Walnut gradient would
    // be too heavy for a placeholder.
    gradient: "from-honey/40 via-honey/15 to-ivory",
    accent: "text-walnut",
  },
  furniture: {
    label: "Furniture",
    icon: FiLayers,
    gradient: "from-moss/30 via-moss/10 to-ivory",
    accent: "text-moss-dark",
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
 * Card is image-first. With a cover photo, the image's natural aspect ratio
 * drives the card's height — that's what gives Pinterest its "pinned to a
 * board" feel (tall portraits, short landscapes, all mixed).
 *
 * Without a photo, we use `gradientAspect` (from the varied rotation in the
 * grid) so the placeholder cards also breathe.
 */
export function ProjectCard({
  project,
  gradientAspect = "aspect-[4/5]",
}: {
  project: ProjectCardData;
  gradientAspect?: string;
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
      href={`/projects/project/${project.id}`}
      className="group relative block w-full overflow-hidden rounded-xl shadow-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-terracotta"
    >
      {hasImage ? (
        // The image's natural aspect ratio IS the card height. Pinterest feel.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.cover_image_url!}
          alt={project.name}
          className="block w-full h-auto transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div
          className={`flex w-full flex-col items-center justify-center bg-gradient-to-br ${meta?.gradient ?? "from-cream to-border-warm"} p-4 ${gradientAspect}`}
        >
          <CategoryIcon
            className={`h-12 w-12 ${meta?.accent ?? "text-warm-gray"} opacity-60 mb-2`}
          />
          <p className="text-center font-serif text-base text-charcoal px-2 line-clamp-2">
            {project.name}
          </p>
          <p className={`mt-1 text-[10px] font-medium ${meta?.accent ?? "text-warm-gray"}`}>
            {meta?.label ?? "Project"}
          </p>
        </div>
      )}

      {/* Always-visible pills on top of the image */}
      <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1.5">
        {project.parentProject ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/90 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-semibold text-terracotta-dark shadow-sm max-w-[70%] truncate">
            <FiLink className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{project.parentProject.name}</span>
          </span>
        ) : (
          <span />
        )}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur-sm shadow-sm ${status.cls}`}
        >
          {status.text}
        </span>
      </div>

      {/* Hover overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-charcoal/95 via-charcoal/60 to-charcoal/10 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <h3 className="font-serif text-base text-white drop-shadow-sm leading-tight line-clamp-2">
          {project.name}
        </h3>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-[11px] text-white/85">
            {project.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-white/90">
          {meta?.label && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 font-medium backdrop-blur-sm">
              <CategoryIcon className="h-2.5 w-2.5" />
              {meta.label}
            </span>
          )}
          <span className="inline-flex items-center gap-0.5">
            <FiClipboard className="h-2.5 w-2.5" />
            {project.stageCount}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <FiTool className="h-2.5 w-2.5" />
            {project.completedStepCount}/{project.stepCount}
          </span>
          {project.subProjectCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-terracotta">
              <FiPackage className="h-2.5 w-2.5" />
              {project.subProjectCount}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[9px] text-white/80">
          <span>{formatDate(project.updated_at)}</span>
          {project.stepCount > 0 && (
            <>
              <span>·</span>
              <span className="font-semibold text-white">{progressPct}%</span>
            </>
          )}
        </div>
        {project.stepCount > 0 && (
          <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-white/20">
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
