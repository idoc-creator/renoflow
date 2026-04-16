"use client";

import { useState, useEffect, useRef } from "react";
import { FiX, FiSearch, FiShoppingCart, FiCheck } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";

export interface StepTool {
  name: string;
  toolbox_item_id: string | null;
  need_to_buy: boolean;
}

interface ToolboxMatch {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  category: string;
}

interface ToolPickerProps {
  tools: StepTool[];
  onChange: (next: StepTool[]) => void;
}

export default function ToolPicker({ tools, onChange }: ToolPickerProps) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ToolboxMatch[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allToolbox, setAllToolbox] = useState<ToolboxMatch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load toolbox items once
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("toolbox_items")
        .select("id, name, make, model, category")
        .eq("user_id", user.id)
        .order("name");

      if (data) {
        setAllToolbox(data as ToolboxMatch[]);
      }
      setLoaded(true);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter results when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const alreadyAdded = new Set(
      tools.filter((t) => t.toolbox_item_id).map((t) => t.toolbox_item_id)
    );
    setResults(
      allToolbox
        .filter(
          (t) =>
            !alreadyAdded.has(t.id) &&
            (t.name.toLowerCase().includes(q) ||
              (t.make && t.make.toLowerCase().includes(q)) ||
              (t.model && t.model.toLowerCase().includes(q)))
        )
        .slice(0, 8)
    );
  }, [query, allToolbox, tools]);

  function addFromToolbox(item: ToolboxMatch) {
    onChange([
      ...tools,
      { name: item.name, toolbox_item_id: item.id, need_to_buy: false },
    ]);
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function addManual(name: string) {
    if (!name.trim()) return;
    // Check if it's already added
    if (tools.some((t) => t.name.toLowerCase() === name.trim().toLowerCase()))
      return;
    onChange([
      ...tools,
      { name: name.trim(), toolbox_item_id: null, need_to_buy: true },
    ]);
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function removeTool(index: number) {
    onChange(tools.filter((_, i) => i !== index));
  }

  function toggleBuy(index: number) {
    onChange(
      tools.map((t, i) =>
        i === index ? { ...t, need_to_buy: !t.need_to_buy } : t
      )
    );
  }

  return (
    <div className="space-y-2">
      {/* Chips */}
      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tools.map((tool, i) => (
            <span
              key={`${tool.name}-${i}`}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                tool.need_to_buy
                  ? "bg-terracotta/10 text-terracotta"
                  : "bg-sage/15 text-sage-dark"
              }`}
            >
              {tool.need_to_buy ? (
                <FiShoppingCart className="h-3 w-3" />
              ) : (
                <FiCheck className="h-3 w-3" />
              )}
              {tool.name}
              <button
                type="button"
                onClick={() => toggleBuy(i)}
                className="ml-0.5 hover:opacity-70"
                title={
                  tool.need_to_buy ? "Mark as owned" : "Mark as need to buy"
                }
              >
                {tool.need_to_buy ? "✓" : "$"}
              </button>
              <button
                type="button"
                onClick={() => removeTool(i)}
                className="hover:opacity-70"
                aria-label="Remove"
              >
                <FiX className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-md border border-border-warm bg-white px-3 py-2">
          <FiSearch className="h-3.5 w-3.5 text-warm-gray shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (results.length > 0) {
                  addFromToolbox(results[0]);
                } else if (query.trim()) {
                  addManual(query);
                }
              }
            }}
            placeholder={
              loaded
                ? allToolbox.length > 0
                  ? "Search your toolbox or type a new tool..."
                  : "Type a tool name (add to toolbox later)"
                : "Loading toolbox..."
            }
            className="flex-1 bg-transparent text-sm text-charcoal focus:outline-none placeholder:text-warm-gray"
          />
        </div>

        {/* Dropdown */}
        {showDropdown && query.trim() && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-border-warm bg-white shadow-lg max-h-48 overflow-y-auto">
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addFromToolbox(item)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cream transition-colors"
              >
                <FiCheck className="h-3 w-3 text-sage shrink-0" />
                <span className="text-charcoal">{item.name}</span>
                {(item.make || item.model) && (
                  <span className="text-warm-gray text-xs">
                    {[item.make, item.model].filter(Boolean).join(" ")}
                  </span>
                )}
              </button>
            ))}
            {results.length === 0 && query.trim() && (
              <button
                type="button"
                onClick={() => addManual(query)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cream transition-colors"
              >
                <FiShoppingCart className="h-3 w-3 text-terracotta shrink-0" />
                <span className="text-charcoal">
                  Add &quot;{query.trim()}&quot;
                </span>
                <span className="text-terracotta text-xs">· need to buy</span>
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] text-warm-gray">
        <FiCheck className="inline h-2.5 w-2.5 text-sage" /> = owned ·{" "}
        <FiShoppingCart className="inline h-2.5 w-2.5 text-terracotta" /> =
        need to buy
      </p>
    </div>
  );
}
