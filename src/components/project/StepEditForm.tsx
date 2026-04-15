"use client";

import { useState } from "react";

export interface StepFormData {
  title: string;
  description: string;
  skill_level: string;
  estimated_minutes: number;
  tools_needed: string[];
}

interface StepEditFormProps {
  initial?: Partial<StepFormData>;
  onSave: (data: StepFormData) => void | Promise<void>;
  onCancel: () => void;
  saveLabel?: string;
}

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "hire_out", label: "Hire out" },
];

export default function StepEditForm({
  initial,
  onSave,
  onCancel,
  saveLabel = "Save",
}: StepEditFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [skillLevel, setSkillLevel] = useState(
    initial?.skill_level ?? "beginner"
  );
  const [minutes, setMinutes] = useState<string>(
    initial?.estimated_minutes !== undefined
      ? String(initial.estimated_minutes)
      : ""
  );
  const [toolsText, setToolsText] = useState(
    initial?.tools_needed ? initial.tools_needed.join(", ") : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      skill_level: skillLevel,
      estimated_minutes: minutes ? parseInt(minutes, 10) : 0,
      tools_needed: toolsText
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    });
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border-warm bg-cream p-3 space-y-3"
    >
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Step title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Cut new PEX lines for the shower"
          required
          className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          What to do
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed instructions for this step"
          rows={2}
          className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Skill level
          </label>
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          >
            {SKILL_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Estimated minutes
          </label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="0"
            min={0}
            step={5}
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">
          Tools (comma separated)
        </label>
        <input
          type="text"
          value={toolsText}
          onChange={(e) => setToolsText(e.target.value)}
          placeholder="e.g., PEX crimper, tape measure, tubing cutter"
          className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !title.trim()}
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
