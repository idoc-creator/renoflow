"use client";

import { useState } from "react";
import ConsumableEditor from "./ConsumableEditor";
import {
  CATEGORIES,
  STATUSES,
  type Consumable,
  type ToolCategory,
  type ToolStatus,
  type ToolboxItem,
} from "./types";

export interface ToolFormData {
  name: string;
  category: ToolCategory;
  make: string | null;
  model: string | null;
  status: ToolStatus;
  location: string | null;
  notes: string | null;
  purchase_price: number | null;
  manual_url: string | null;
  consumables: Consumable[];
  catalog_entry_id: string | null;
}

interface ToolEditFormProps {
  initial?: Partial<ToolboxItem>;
  onSave: (data: ToolFormData) => void | Promise<void>;
  onCancel: () => void;
  saveLabel?: string;
}

const SELECTABLE_CATEGORIES = CATEGORIES.filter((c) => c.value !== "all");

export default function ToolEditForm({
  initial,
  onSave,
  onCancel,
  saveLabel = "Save",
}: ToolEditFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<ToolCategory>(
    (initial?.category as ToolCategory) ?? "hand_tool"
  );
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [status, setStatus] = useState<ToolStatus>(
    (initial?.status as ToolStatus) ?? "ready"
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [purchasePrice, setPurchasePrice] = useState<string>(
    initial?.purchase_price !== undefined && initial?.purchase_price !== null
      ? String(initial.purchase_price)
      : ""
  );
  const [manualUrl, setManualUrl] = useState(initial?.manual_url ?? "");
  const [consumables, setConsumables] = useState<Consumable[]>(
    initial?.consumables ?? []
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      category,
      make: make.trim() || null,
      model: model.trim() || null,
      status,
      location: location.trim() || null,
      notes: notes.trim() || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      manual_url: manualUrl.trim() || null,
      consumables: consumables.filter((c) => c.name.trim().length > 0),
      catalog_entry_id: (initial as { catalog_entry_id?: string })?.catalog_entry_id ?? null,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Tool name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., DeWalt Circular Saw"
          required
          autoFocus
          className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ToolCategory)}
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          >
            {SELECTABLE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ToolStatus)}
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Make
          </label>
          <input
            type="text"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="DeWalt"
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Model
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="DCS391"
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Garage shelf 2"
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Purchase price
          </label>
          <input
            type="number"
            step={0.01}
            min={0}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Manual URL
        </label>
        <input
          type="url"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to remember"
          rows={2}
          className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal mb-2">
          Consumables
        </label>
        <ConsumableEditor
          consumables={consumables}
          onChange={setConsumables}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : saveLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-warm-gray hover:text-charcoal text-sm px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
