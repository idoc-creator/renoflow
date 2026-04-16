"use client";

import { useState, useMemo } from "react";
import { FiSearch, FiTool, FiShield, FiZap, FiTarget, FiBox } from "react-icons/fi";
import Link from "next/link";

interface CatalogEntry {
  id: string;
  name: string;
  category: string;
  make: string | null;
  model: string | null;
  description: string | null;
  avg_price: number | null;
  typical_consumables: Array<{ name: string }>;
  manual_url: string | null;
  is_verified: boolean;
}

const CATEGORIES = [
  { value: "all", label: "All", icon: FiBox },
  { value: "hand_tool", label: "Hand Tools", icon: FiTool },
  { value: "power_tool", label: "Power Tools", icon: FiZap },
  { value: "ppe", label: "PPE", icon: FiShield },
  { value: "measuring", label: "Measuring", icon: FiTarget },
  { value: "other", label: "Other", icon: FiBox },
];

const CATEGORY_COLORS: Record<string, string> = {
  hand_tool: "bg-sage/10 text-sage-dark",
  power_tool: "bg-terracotta/10 text-terracotta",
  ppe: "bg-amber-100 text-amber-800",
  measuring: "bg-blue-50 text-blue-700",
  other: "bg-warm-gray/10 text-warm-gray",
};

interface ShedClientProps {
  entries: CatalogEntry[];
  isAuthed: boolean;
}

export default function ShedClient({ entries, isAuthed }: ShedClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    let result = entries;
    if (activeCategory !== "all") {
      result = result.filter((e) => e.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.make && e.make.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [entries, activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const e of entries) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    }
    return counts;
  }, [entries]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-charcoal mb-2">
          The Storage Shed
        </h1>
        <p className="text-warm-gray text-lg max-w-2xl">
          A community catalog of verified tools, PPE, and equipment. Pick from
          the Shed when adding to your toolbox — everything auto-fills.
        </p>
        <p className="text-warm-gray text-sm mt-1">
          {entries.length} tools cataloged{" "}
          {isAuthed && (
            <span>
              ·{" "}
              <Link
                href="/bunker/toolbox"
                className="text-terracotta hover:text-terracotta-dark"
              >
                Go to My Toolbox →
              </Link>
            </span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-lg">
        <div className="flex items-center gap-2 rounded-full border border-border-warm bg-white px-4 py-2.5">
          <FiSearch className="h-4 w-4 text-warm-gray shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="flex-1 bg-transparent text-sm text-charcoal focus:outline-none placeholder:text-warm-gray"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-warm-gray hover:text-charcoal"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = cat.value === activeCategory;
          const count = categoryCounts[cat.value] || 0;
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-charcoal text-white"
                  : "bg-white border border-border-warm text-warm-gray hover:text-charcoal"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
              <span
                className={`text-xs ${isActive ? "text-white/70" : "text-warm-gray"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-2xl text-charcoal">No tools found</p>
          <p className="text-warm-gray text-sm mt-1">
            Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((entry) => (
            <ToolEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolEntryCard({ entry }: { entry: CatalogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl bg-white border border-border-warm shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Category color bar */}
      <div
        className={`h-1 ${
          CATEGORY_COLORS[entry.category]?.split(" ")[0] ?? "bg-warm-gray/20"
        }`}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg text-charcoal leading-tight">
              {entry.name}
            </h3>
            {entry.make && (
              <p className="text-xs text-warm-gray mt-0.5">{entry.make}</p>
            )}
          </div>
          {entry.avg_price !== null && (
            <span className="text-sm font-semibold text-charcoal shrink-0">
              ~${entry.avg_price}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              CATEGORY_COLORS[entry.category] ?? "bg-warm-gray/10 text-warm-gray"
            }`}
          >
            {entry.category.replace("_", " ")}
          </span>
          {entry.is_verified && (
            <span className="text-[10px] text-sage-dark">✓ verified</span>
          )}
          {entry.typical_consumables?.length > 0 && (
            <span className="text-[10px] text-warm-gray">
              {entry.typical_consumables.length} consumable
              {entry.typical_consumables.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border-warm space-y-2">
            {entry.description && (
              <p className="text-xs text-warm-gray">{entry.description}</p>
            )}

            {entry.typical_consumables?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-charcoal uppercase tracking-wide mb-1">
                  Typical consumables
                </p>
                <ul className="space-y-0.5">
                  {entry.typical_consumables.map((c, i) => (
                    <li
                      key={i}
                      className="text-xs text-warm-gray flex items-center gap-1"
                    >
                      <span className="h-1 w-1 rounded-full bg-warm-gray/40 shrink-0" />
                      {typeof c === "string" ? c : c.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {entry.manual_url && (
              <a
                href={entry.manual_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-terracotta hover:text-terracotta-dark font-semibold"
                onClick={(e) => e.stopPropagation()}
              >
                Open manual →
              </a>
            )}

            {/* Future: "Where to buy" affiliate links */}
            <div className="rounded-md bg-cream p-2 text-center">
              <p className="text-[10px] text-warm-gray">
                Where to buy · How to use · Best practices
              </p>
              <p className="text-[10px] text-warm-gray italic">Coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
