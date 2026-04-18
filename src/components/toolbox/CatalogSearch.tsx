"use client";

import { useState, useEffect, useRef } from "react";
import { FiSearch, FiCheck } from "react-icons/fi";
import type { ToolCategory, ToolboxItem, Consumable } from "./types";

interface CatalogEntry {
  id: string;
  name: string;
  category: ToolCategory;
  make: string | null;
  model: string | null;
  description: string | null;
  avg_price: number | null;
  typical_consumables: Consumable[];
  manual_url: string | null;
}

interface CatalogSearchProps {
  onSelect: (prefill: Partial<ToolboxItem> & { catalog_entry_id: string }) => void;
}

export default function CatalogSearch({ onSelect }: CatalogSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    // Debounce 300ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tools/catalog-search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function handleSelect(entry: CatalogEntry) {
    onSelect({
      catalog_entry_id: entry.id,
      name: entry.name,
      category: entry.category,
      make: entry.make,
      model: entry.model,
      notes: entry.description,
      purchase_price: entry.avg_price,
      manual_url: entry.manual_url,
      consumables: (entry.typical_consumables ?? []).map((c, i) => {
        const base = typeof c === "object" && c !== null ? c : { name: String(c) };
        return {
          id: `catalog-${i}-${Math.random().toString(36).slice(2, 6)}`,
          name: base.name ?? "",
          quantity_on_hand: 0,
          reorder_date: null,
          notes: null,
        };
      }),
    });
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="mb-4">
      <div className="rounded-lg bg-sage/5 border border-sage/20 p-3">
        <p className="text-xs font-semibold text-sage-dark mb-2">
          🔧 Search the Storage Shed
        </p>
        <div className="relative">
          <div className="flex items-center gap-2 rounded-md border border-border-warm bg-white px-3 py-2">
            <FiSearch className="h-3.5 w-3.5 text-warm-gray shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder="Type a tool name to find it in the Shed..."
              className="flex-1 bg-transparent text-sm text-charcoal focus:outline-none placeholder:text-warm-gray"
            />
            {loading && (
              <span className="text-[10px] text-warm-gray">Searching...</span>
            )}
          </div>

          {open && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border-warm bg-white shadow-lg max-h-64 overflow-y-auto">
              {results.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(entry)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-cream transition-colors border-b border-border-warm last:border-0"
                >
                  <FiCheck className="h-3.5 w-3.5 text-sage shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal">
                        {entry.name}
                      </span>
                      {entry.make && (
                        <span className="text-xs text-warm-gray">
                          {entry.make}
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="text-[11px] text-warm-gray line-clamp-1 mt-0.5">
                        {entry.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-warm-gray">
                        {entry.category.replace("_", " ")}
                      </span>
                      {entry.avg_price !== null && (
                        <span className="text-[10px] text-warm-gray">
                          ~${entry.avg_price}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {open && query.trim().length >= 2 && results.length === 0 && !loading && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border-warm bg-white shadow-lg px-3 py-3 text-center">
              <p className="text-xs text-warm-gray">
                Not in the Shed yet. Fill in below and you can contribute it.
              </p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-sage-dark/60 mt-1.5">
          30 verified tools in the Shed. Pick one to auto-fill everything.
        </p>
      </div>
    </div>
  );
}
