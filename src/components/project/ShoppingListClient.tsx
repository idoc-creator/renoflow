"use client";

import { useState, useMemo, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { FiPlus, FiShoppingBag, FiLoader, FiDownload } from "react-icons/fi";

interface Stage {
  id: string;
  title: string;
  sort_order: number;
}

interface ShoppingItem {
  id: string;
  project_id: string;
  stage_id: string | null;
  name: string;
  quantity: number | null;
  unit: string | null;
  estimated_price: number | null;
  actual_price: number | null;
  is_purchased: boolean;
  created_at: string;
  lead_time_days: number | null;
  order_by_date: string | null;
}

interface ShoppingListClientProps {
  projectId: string;
  stages: Stage[];
  initialItems: ShoppingItem[];
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ShoppingListClient({
  projectId,
  stages,
  initialItems,
}: ShoppingListClientProps) {
  const [items, setItems] = useState(initialItems);
  const [showAddForm, setShowAddForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Add item form state
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newEstPrice, setNewEstPrice] = useState("");
  const [newStageId, setNewStageId] = useState("");
  const [newLeadDays, setNewLeadDays] = useState("");
  const [newOrderBy, setNewOrderBy] = useState("");

  // Group items by stage, with unpurchased first
  const grouped = useMemo(() => {
    const stageMap = new Map<string | null, ShoppingItem[]>();

    // Sort: unchecked first, then checked
    const sorted = [...items].sort((a, b) => {
      if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
      return 0;
    });

    for (const item of sorted) {
      const key = item.stage_id;
      if (!stageMap.has(key)) stageMap.set(key, []);
      stageMap.get(key)!.push(item);
    }

    // Order by stage sort_order
    const stageOrder = new Map(stages.map((s) => [s.id, s.sort_order]));
    const entries = Array.from(stageMap.entries()).sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return (stageOrder.get(a) ?? 999) - (stageOrder.get(b) ?? 999);
    });

    return entries;
  }, [items, stages]);

  const stageNameMap = useMemo(
    () => new Map(stages.map((s) => [s.id, s.title])),
    [stages]
  );

  // Totals
  const estimatedTotal = items.reduce(
    (s, i) => s + (Number(i.estimated_price) || 0) * (Number(i.quantity) || 1),
    0
  );
  const actualTotal = items.reduce(
    (s, i) => s + (Number(i.actual_price) || 0) * (Number(i.quantity) || 1),
    0
  );
  const difference = estimatedTotal - actualTotal;

  async function togglePurchased(item: ShoppingItem) {
    const newVal = !item.is_purchased;
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              is_purchased: newVal,
              purchased_at: newVal ? new Date().toISOString() : null,
            }
          : i
      ) as ShoppingItem[]
    );

    const supabase = createClient();
    await supabase
      .from("shopping_list_items")
      .update({
        is_purchased: newVal,
        purchased_at: newVal ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
  }

  async function updateActualPrice(itemId: string, value: string) {
    const numVal = value ? parseFloat(value) : null;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, actual_price: numVal } : i
      )
    );

    const supabase = createClient();
    await supabase
      .from("shopping_list_items")
      .update({ actual_price: numVal })
      .eq("id", itemId);
  }

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("shopping_list_items")
      .insert({
        project_id: projectId,
        stage_id: newStageId || null,
        name: newName,
        quantity: newQty ? parseFloat(newQty) : 1,
        unit: newUnit || null,
        estimated_price: newEstPrice ? parseFloat(newEstPrice) : null,
        lead_time_days: newLeadDays ? parseInt(newLeadDays, 10) : null,
        order_by_date: newOrderBy || null,
      })
      .select("*")
      .single();

    if (!error && data) {
      setItems((prev) => [...prev, data as ShoppingItem]);
      setNewName("");
      setNewQty("");
      setNewUnit("");
      setNewEstPrice("");
      setNewStageId("");
      setNewLeadDays("");
      setNewOrderBy("");
      setShowAddForm(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch(`/api/projects/${projectId}/generate-shopping-list`, {
      method: "POST",
    });
    if (res.ok) {
      const { items: newItems } = await res.json();
      setItems((prev) => [...prev, ...newItems]);
    }
    setGenerating(false);
  }

  return (
    <div className="pb-8">
      {/* Header — title comes from the outer page section, we just render actions */}
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <div className="flex gap-2">
          {items.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg border border-sage/30 bg-sage/10 px-3 py-2 text-sm font-medium text-sage-dark transition-colors hover:bg-sage/20 disabled:opacity-50"
            >
              {generating ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiDownload className="h-4 w-4" />
              )}
              Auto-generate from Plan
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
          >
            <FiPlus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Items grouped by stage */}
      {items.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(([stageId, stageItems]) => (
            <div key={stageId ?? "ungrouped"}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-warm-gray">
                {stageId ? stageNameMap.get(stageId) || "Stage" : "General"}
              </h3>
              <div className="space-y-2">
                {stageItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ${
                      item.is_purchased ? "opacity-60" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => togglePurchased(item)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        item.is_purchased
                          ? "border-teal-500 bg-sage/100 text-white"
                          : "border-border-warm hover:border-teal-400"
                      }`}
                    >
                      {item.is_purchased && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Name + qty */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          item.is_purchased
                            ? "text-warm-gray line-through"
                            : "text-charcoal"
                        }`}
                      >
                        {item.name}
                      </p>
                      {(item.quantity || item.unit) && (
                        <p className="text-xs text-warm-gray">
                          {item.quantity || ""} {item.unit || ""}
                        </p>
                      )}
                      {(item.order_by_date || item.lead_time_days) && (
                        <p className="mt-0.5 text-[11px] text-terracotta-dark">
                          {item.order_by_date && (
                            <>Order by {formatShortDate(item.order_by_date)}</>
                          )}
                          {!item.order_by_date && item.lead_time_days && (
                            <>~{item.lead_time_days}d lead</>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Prices */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.estimated_price != null && (
                        <span className="text-xs text-warm-gray">
                          est. ${Number(item.estimated_price).toFixed(2)}
                        </span>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Actual $"
                        defaultValue={
                          item.actual_price != null
                            ? Number(item.actual_price).toFixed(2)
                            : ""
                        }
                        onBlur={(e) =>
                          updateActualPrice(item.id, e.target.value)
                        }
                        className="w-20 rounded-md border border-border-warm px-2 py-1 text-right text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="rounded-xl bg-charcoal p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] font-semibold uppercase text-warm-gray">
                  Estimated
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  ${estimatedTotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-warm-gray">
                  Actual
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  ${actualTotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-warm-gray">
                  Difference
                </p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    difference >= 0 ? "text-sage" : "text-red-400"
                  }`}
                >
                  {difference >= 0 ? "+" : ""}${difference.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-warm bg-white py-16">
          <FiShoppingBag className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-semibold text-charcoal">
            No items yet
          </h3>
          <p className="mt-1 text-center text-sm text-warm-gray">
            Auto-generate from your plan or add items manually
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg border border-sage/30 bg-sage/10 px-4 py-2.5 text-sm font-medium text-sage-dark hover:bg-sage/20 disabled:opacity-50"
            >
              {generating ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiDownload className="h-4 w-4" />
              )}
              Auto-generate
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-dark"
            >
              <FiPlus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Add Item inline form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-charcoal">
              Add Item
            </h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Item name"
                className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder="Qty"
                  className="w-20 rounded-lg border border-border-warm px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="Unit (ea, ft, gal...)"
                  className="flex-1 rounded-lg border border-border-warm px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <input
                type="number"
                step="0.01"
                value={newEstPrice}
                onChange={(e) => setNewEstPrice(e.target.value)}
                placeholder="Estimated price"
                className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
              <select
                value={newStageId}
                onChange={(e) => setNewStageId(e.target.value)}
                className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">No stage (general)</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={newLeadDays}
                  onChange={(e) => setNewLeadDays(e.target.value)}
                  placeholder="Lead time (days)"
                  className="w-32 rounded-lg border border-border-warm px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
                <input
                  type="date"
                  value={newOrderBy}
                  onChange={(e) => setNewOrderBy(e.target.value)}
                  placeholder="Order by"
                  className="flex-1 rounded-lg border border-border-warm px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-warm-gray">
                Tile, vanities & custom glass typically run 2–12 weeks. Setting
                an &ldquo;order by&rdquo; date surfaces it on your Overview.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-lg border border-border-warm px-4 py-2 text-sm font-medium text-warm-gray hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-dark"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
