"use client";

import { useMemo, useState } from "react";
import { FiFilter, FiChevronDown } from "react-icons/fi";
import { ProjectCard, type ProjectCardData } from "./ProjectCard";

type SortKey = "recent" | "alpha" | "status" | "progress";

const STATUS_PRIORITY: Record<string, number> = {
  in_progress: 0,
  planning: 1,
  paused: 2,
  completed: 3,
};

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "alpha", label: "A → Z" },
  { key: "status", label: "Active first" },
  { key: "progress", label: "Progress" },
];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "planning", label: "Planning" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Complete" },
  { key: "paused", label: "Paused" },
];

const CATEGORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "renovation", label: "Renovation" },
  { key: "furniture", label: "Furniture" },
  { key: "craft", label: "Craft" },
  { key: "decor", label: "Decor" },
  { key: "outdoor", label: "Outdoor" },
];

/** Assign a varying aspect ratio to each card index so the grid breathes. */
const ASPECTS = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[1/1]",
  "aspect-[4/5]",
  "aspect-[5/6]",
  "aspect-[4/6]",
];

function sortCards(cards: ProjectCardData[], sortKey: SortKey): ProjectCardData[] {
  const copy = [...cards];
  switch (sortKey) {
    case "alpha":
      copy.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "status":
      copy.sort((a, b) => {
        const sa = STATUS_PRIORITY[a.status] ?? 99;
        const sb = STATUS_PRIORITY[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
      break;
    case "progress":
      copy.sort((a, b) => {
        const pa = a.stepCount > 0 ? a.completedStepCount / a.stepCount : 0;
        const pb = b.stepCount > 0 ? b.completedStepCount / b.stepCount : 0;
        return pb - pa;
      });
      break;
    case "recent":
    default:
      copy.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }
  return copy;
}

/**
 * Organize cards so sub-projects appear directly after their parent. Any
 * orphaned children (parent filtered out) land at the end.
 */
function organize(cards: ProjectCardData[], sortKey: SortKey): ProjectCardData[] {
  const sorted = sortCards(cards, sortKey);
  const byId = new Map(sorted.map((c) => [c.id, c]));
  const kidsByParent = new Map<string, ProjectCardData[]>();
  const roots: ProjectCardData[] = [];
  for (const c of sorted) {
    if (c.parentProject && byId.has(c.parentProject.id)) {
      const arr = kidsByParent.get(c.parentProject.id) ?? [];
      arr.push(c);
      kidsByParent.set(c.parentProject.id, arr);
    } else {
      roots.push(c);
    }
  }
  const out: ProjectCardData[] = [];
  for (const r of roots) {
    out.push(r);
    const kids = kidsByParent.get(r.id);
    if (kids) out.push(...kids);
  }
  return out;
}

export function ProjectGrid({ cards }: { cards: ProjectCardData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (categoryFilter !== "all" && c.category !== categoryFilter)
        return false;
      return true;
    });
  }, [cards, statusFilter, categoryFilter]);

  const organized = useMemo(
    () => organize(filtered, sortKey),
    [filtered, sortKey]
  );

  const activeFiltersCount =
    (statusFilter !== "all" ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0);

  return (
    <>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-white border border-border-warm p-3">
        {/* Sort dropdown */}
        <label className="inline-flex items-center gap-2 text-xs text-warm-gray">
          Sort
          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="appearance-none rounded-lg border border-border-warm bg-white pl-3 pr-7 py-1.5 text-xs font-medium text-charcoal focus:outline-none focus:border-terracotta"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-warm-gray" />
          </div>
        </label>

        <span className="h-5 w-px bg-border-warm" />

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            filtersOpen || activeFiltersCount > 0
              ? "border-terracotta bg-terracotta/5 text-terracotta-dark"
              : "border-border-warm bg-white text-charcoal hover:border-terracotta"
          }`}
        >
          <FiFilter className="h-3 w-3" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-terracotta px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Results count */}
        <span className="ml-auto text-[11px] text-warm-gray">
          {organized.length} of {cards.length} project
          {cards.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="mb-4 rounded-xl bg-white border border-border-warm p-4 space-y-3">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-warm-gray">
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s.key
                      ? "bg-terracotta border-terracotta text-white"
                      : "bg-white border-border-warm text-charcoal hover:border-terracotta"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-warm-gray">
              Category
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_FILTERS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategoryFilter(c.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    categoryFilter === c.key
                      ? "bg-sage border-sage text-white"
                      : "bg-white border-border-warm text-charcoal hover:border-sage"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="text-[11px] text-warm-gray hover:text-charcoal underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Masonry via CSS columns so cards can have varied heights.
          break-inside: avoid keeps each card intact across the column break. */}
      {organized.length > 0 ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {organized.map((p, idx) => (
            <div
              key={p.id}
              className="break-inside-avoid"
              style={{ breakInside: "avoid" }}
            >
              <ProjectCard
                project={p}
                aspectClass={ASPECTS[idx % ASPECTS.length]}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-warm bg-white/50 py-12 text-center">
          <p className="font-serif text-lg text-charcoal">
            Nothing matches those filters
          </p>
          <button
            onClick={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
            className="mt-2 text-xs text-terracotta hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
