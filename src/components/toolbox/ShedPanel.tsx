"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiX,
  FiSearch,
  FiPlus,
  FiExternalLink,
  FiChevronLeft,
} from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";

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
  trades: string[];
}

const TRADES = [
  { key: "all", label: "All" },
  { key: "demolition", label: "Demolition" },
  { key: "plumbing", label: "Plumbing" },
  { key: "electrical", label: "Electrical" },
  { key: "tiling", label: "Tiling" },
  { key: "drywall", label: "Drywall" },
  { key: "woodworking", label: "Woodworking" },
  { key: "painting", label: "Painting" },
  { key: "sewing", label: "Sewing" },
  { key: "crafts", label: "Crafts" },
  { key: "measuring", label: "Measuring" },
  { key: "safety", label: "Safety" },
  { key: "general", label: "General" },
];

interface ShedPanelProps {
  open: boolean;
  onClose: () => void;
  onAddToToolbox?: (entry: CatalogEntry) => void;
}

export default function ShedPanel({
  open,
  onClose,
  onAddToToolbox,
}: ShedPanelProps) {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTrade, setActiveTrade] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);

  useEffect(() => {
    if (!open || loaded) return;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("catalog_entries")
        .select("*")
        .order("name");
      if (data) {
        setEntries(data as CatalogEntry[]);
      }
      setLoaded(true);
    }
    load();
  }, [open, loaded]);

  const filtered = useMemo(() => {
    let result = entries;
    if (activeTrade !== "all") {
      result = result.filter((e) =>
        (e.trades ?? []).includes(activeTrade)
      );
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
  }, [entries, activeTrade, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/20"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="relative z-10 w-full max-w-xl bg-cream border-l border-border-warm flex flex-col shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border-warm bg-white shrink-0">
          {selectedEntry ? (
            <button
              onClick={() => setSelectedEntry(null)}
              className="flex items-center gap-1 text-sm text-warm-gray hover:text-charcoal"
            >
              <FiChevronLeft className="h-4 w-4" />
              Back to Shed
            </button>
          ) : (
            <div>
              <h2 className="font-serif text-xl text-charcoal">
                Storage Shed
              </h2>
              <p className="text-[10px] text-warm-gray">
                {entries.length} tools cataloged
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-warm-gray hover:text-charcoal p-1"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </header>

        {selectedEntry ? (
          <ToolDetail
            entry={selectedEntry}
            onAddToToolbox={
              onAddToToolbox
                ? () => {
                    onAddToToolbox(selectedEntry);
                    onClose();
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Search */}
            <div className="p-3 border-b border-border-warm bg-white shrink-0">
              <div className="flex items-center gap-2 rounded-full border border-border-warm bg-cream px-3 py-2">
                <FiSearch className="h-3.5 w-3.5 text-warm-gray shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the Shed..."
                  className="flex-1 bg-transparent text-sm text-charcoal focus:outline-none placeholder:text-warm-gray"
                />
              </div>
            </div>

            {/* Trade tabs */}
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-border-warm bg-white shrink-0">
              {TRADES.map((trade) => {
                const isActive = trade.key === activeTrade;
                return (
                  <button
                    key={trade.key}
                    onClick={() => setActiveTrade(trade.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-charcoal text-white"
                        : "bg-white border border-border-warm text-warm-gray hover:text-charcoal"
                    }`}
                  >
                    {trade.label}
                  </button>
                );
              })}
            </div>

            {/* Tool list */}
            <div className="flex-1 overflow-y-auto p-3">
              {!loaded ? (
                <p className="text-center text-warm-gray text-sm py-8">
                  Loading...
                </p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-warm-gray text-sm py-8">
                  No tools found.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="text-left rounded-xl bg-white border border-border-warm p-3 hover:shadow-md transition-shadow"
                    >
                      {/* Placeholder image area */}
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-cream to-border-warm mb-2 flex items-center justify-center">
                        <span className="text-3xl opacity-30">
                          {entry.category === "power_tool"
                            ? "⚡"
                            : entry.category === "hand_tool"
                              ? "🔧"
                              : entry.category === "ppe"
                                ? "🛡️"
                                : entry.category === "measuring"
                                  ? "📐"
                                  : "📦"}
                        </span>
                      </div>
                      <h3 className="font-serif text-sm text-charcoal leading-tight line-clamp-2">
                        {entry.name}
                      </h3>
                      {entry.make && (
                        <p className="text-[10px] text-warm-gray mt-0.5">
                          {entry.make}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function ToolDetail({
  entry,
  onAddToToolbox,
}: {
  entry: CatalogEntry;
  onAddToToolbox?: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero image area */}
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-cream to-border-warm flex items-center justify-center">
        <span className="text-6xl opacity-20">
          {entry.category === "power_tool"
            ? "⚡"
            : entry.category === "hand_tool"
              ? "🔧"
              : entry.category === "ppe"
                ? "🛡️"
                : entry.category === "measuring"
                  ? "📐"
                  : "📦"}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-charcoal">{entry.name}</h2>
          {entry.make && (
            <p className="text-sm text-warm-gray">{entry.make} {entry.model ?? ""}</p>
          )}
        </div>

        {entry.description && (
          <p className="text-sm text-charcoal leading-relaxed">
            {entry.description}
          </p>
        )}

        {/* Price + Trades */}
        <div className="flex flex-wrap gap-2">
          {entry.avg_price !== null && (
            <span className="rounded-full bg-sage/10 text-sage-dark px-3 py-1 text-xs font-semibold">
              ~${entry.avg_price}
            </span>
          )}
          {(entry.trades ?? []).map((trade) => (
            <span
              key={trade}
              className="rounded-full bg-cream border border-border-warm px-2 py-0.5 text-[10px] text-warm-gray"
            >
              {trade}
            </span>
          ))}
        </div>

        {/* Consumables */}
        {entry.typical_consumables?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wide mb-2">
              Typical consumables
            </h3>
            <ul className="space-y-1">
              {entry.typical_consumables.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-charcoal bg-white rounded-md px-3 py-2 border border-border-warm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-terracotta shrink-0" />
                  {typeof c === "string" ? c : c.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Manual */}
        {entry.manual_url && (
          <a
            href={entry.manual_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-terracotta hover:text-terracotta-dark font-semibold"
          >
            <FiExternalLink className="h-3.5 w-3.5" />
            Open manual
          </a>
        )}

        {/* Where to buy — placeholder */}
        <div className="rounded-xl bg-white border border-border-warm p-4">
          <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wide mb-2">
            Where to buy
          </h3>
          <div className="space-y-2 text-sm text-warm-gray">
            <p className="italic">
              Purchase links coming soon — Home Depot, Lowe&apos;s, Amazon
            </p>
          </div>
        </div>

        {/* Add to toolbox button */}
        {onAddToToolbox && (
          <button
            onClick={onAddToToolbox}
            className="w-full flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Add to My Toolbox
          </button>
        )}
      </div>
    </div>
  );
}
