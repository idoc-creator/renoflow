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
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      // Preserve existing values on edit; default to empty/zero for new stages.
      // These fields still exist in schema and may be filled by template clones
      // or the AI draft flow. We just don't collect them in the manual form.
      reason: initial?.reason ?? "",
      estimated_cost: initial?.estimated_cost ?? 0,
      estimated_hours: initial?.estimated_hours ?? 0,
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
          placeholder="e.g., Demo"
          required
          className="w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Description{" "}
          <span className="font-normal text-warm-gray">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — brief description"
          rows={2}
          className="w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        />
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
