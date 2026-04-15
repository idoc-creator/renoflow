"use client";

import { useState } from "react";

export interface StageFormData {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
}

interface StageEditFormProps {
  initial?: Partial<StageFormData>;
  onSave: (data: StageFormData) => void | Promise<void>;
  onCancel: () => void;
  saveLabel?: string;
}

export default function StageEditForm({
  initial,
  onSave,
  onCancel,
  saveLabel = "Save",
}: StageEditFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [cost, setCost] = useState<string>(
    initial?.estimated_cost !== undefined ? String(initial.estimated_cost) : ""
  );
  const [hours, setHours] = useState<string>(
    initial?.estimated_hours !== undefined
      ? String(initial.estimated_hours)
      : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      reason: reason.trim(),
      estimated_cost: cost ? parseFloat(cost) : 0,
      estimated_hours: hours ? parseFloat(hours) : 0,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-3">
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Stage title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Demo & Prep"
          required
          className="w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          What this stage accomplishes
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what happens in this stage"
          rows={2}
          className="w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Why this order
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this stage sequenced here? (dependencies, livability, etc.)"
          rows={2}
          className="w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Estimated cost ($)
          </label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
            min={0}
            step={1}
            className="w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Estimated hours
          </label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
            min={0}
            step={0.5}
            className="w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
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
