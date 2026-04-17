"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface StageFormData {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
  linked_project_id: string | null;
}

interface StageEditFormProps {
  initial?: Partial<StageFormData> & { id?: string };
  /** The project this stage belongs to — excluded from the linked-project picker. */
  currentProjectId?: string;
  onSave: (data: StageFormData) => void | Promise<void>;
  onCancel: () => void;
  saveLabel?: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

export default function StageEditForm({
  initial,
  currentProjectId,
  onSave,
  onCancel,
  saveLabel = "Save",
}: StageEditFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(
    initial?.linked_project_id ?? null
  );
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [saving, setSaving] = useState(false);

  // Load the user's other projects for the picker
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("updated_at", { ascending: false });
      if (!cancelled && data) {
        setProjects(
          data.filter((p) => p.id !== currentProjectId) as ProjectOption[]
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentProjectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      reason: initial?.reason ?? "",
      estimated_cost: initial?.estimated_cost ?? 0,
      estimated_hours: initial?.estimated_hours ?? 0,
      linked_project_id: linkedProjectId,
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
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Sub-project{" "}
          <span className="font-normal text-warm-gray">(optional)</span>
        </label>
        <select
          value={linkedProjectId ?? ""}
          onChange={(e) => setLinkedProjectId(e.target.value || null)}
          className="w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        >
          <option value="">— Not linked —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-warm-gray">
          Link this stage to another project (e.g. a vanity build inside a
          bathroom reno).
        </p>
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
