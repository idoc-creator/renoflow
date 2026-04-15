"use client";

import { useState } from "react";
import { FiTool, FiChevronDown, FiChevronRight } from "react-icons/fi";
import SubTaskList, { type SubTask } from "./SubTaskList";
import RoughItInPreview from "./RoughItInPreview";

export interface StepFormData {
  title: string;
  description: string;
  skill_level: string;
  estimated_minutes: number;
  tools_needed: string[];
  sub_tasks: SubTask[];
  tips: string | null;
}

interface StepEditFormProps {
  initial?: Partial<StepFormData>;
  projectId?: string;
  stageTitle?: string;
  onSave: (data: StepFormData) => void | Promise<void>;
  onCancel: () => void;
  saveLabel?: string;
}

const SKILL_LEVELS = [
  { value: "", label: "Not set" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "hire_out", label: "Hire out" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function StepEditForm({
  initial,
  projectId,
  stageTitle,
  onSave,
  onCancel,
  saveLabel = "Save",
}: StepEditFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subTasks, setSubTasks] = useState<SubTask[]>(
    initial?.sub_tasks ?? []
  );
  const [tips, setTips] = useState<string | null>(initial?.tips ?? null);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [skillLevel, setSkillLevel] = useState(initial?.skill_level ?? "");
  const [minutes, setMinutes] = useState<string>(
    initial?.estimated_minutes !== undefined
      ? String(initial.estimated_minutes)
      : ""
  );
  const [toolsText, setToolsText] = useState(
    initial?.tools_needed ? initial.tools_needed.join(", ") : ""
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roughItInOpen, setRoughItInOpen] = useState(false);

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
      sub_tasks: subTasks,
      tips,
    });
    setSaving(false);
  }

  function handleAcceptSuggestions(accepted: {
    subTasks: string[];
    tools: string[];
    tips: string[];
  }) {
    // Merge sub-tasks (append new ones)
    const newSubTasks: SubTask[] = accepted.subTasks.map((t) => ({
      id: generateId(),
      title: t,
      is_completed: false,
    }));
    setSubTasks((prev) => [...prev, ...newSubTasks]);

    // Merge tools (append, dedupe case-insensitive)
    if (accepted.tools.length > 0) {
      const existing = toolsText
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const existingLower = new Set(existing.map((t) => t.toLowerCase()));
      const newTools = accepted.tools.filter(
        (t) => !existingLower.has(t.toLowerCase())
      );
      setToolsText([...existing, ...newTools].join(", "));
    }

    // Merge tips (append as markdown bullets)
    if (accepted.tips.length > 0) {
      const newTipsText = accepted.tips.map((t) => `- ${t}`).join("\n");
      setTips((prev) =>
        prev && prev.trim() ? `${prev}\n${newTipsText}` : newTipsText
      );
    }

    setRoughItInOpen(false);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border-warm bg-cream p-4 space-y-4"
      >
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Step title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Demo the existing shower"
            required
            autoFocus
            className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>

        {/* Sub-tasks */}
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-2">
            Sub-tasks
          </label>
          <SubTaskList subTasks={subTasks} onChange={setSubTasks} />
        </div>

        {/* Rough it in button */}
        <button
          type="button"
          onClick={() => setRoughItInOpen(true)}
          disabled={!title.trim()}
          className="flex items-center gap-2 rounded-lg bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiTool className="h-4 w-4" />
          Rough it in
        </button>

        {/* Tips preview */}
        {tips && tips.trim() && (
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Tips
            </label>
            <div className="rounded-md bg-sage/5 border border-sage/20 p-3 text-xs text-charcoal whitespace-pre-wrap">
              {tips}
            </div>
            <button
              type="button"
              onClick={() => setTips(null)}
              className="mt-1 text-[10px] text-warm-gray hover:text-terracotta"
            >
              Clear tips
            </button>
          </div>
        )}

        {/* Advanced (collapsed by default) */}
        <div className="border-t border-border-warm pt-3">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-warm-gray hover:text-charcoal"
          >
            {advancedOpen ? (
              <FiChevronDown className="h-3 w-3" />
            ) : (
              <FiChevronRight className="h-3 w-3" />
            )}
            Advanced details (optional)
          </button>
          {advancedOpen && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Extra notes about this step"
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
                  placeholder="e.g., reciprocating saw, pry bar"
                  className="w-full px-3 py-2 bg-white rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save / Cancel */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="bg-sage hover:bg-sage-dark text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
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

      <RoughItInPreview
        open={roughItInOpen}
        stepTitle={title}
        stageTitle={stageTitle}
        projectId={projectId}
        onClose={() => setRoughItInOpen(false)}
        onAccept={handleAcceptSuggestions}
      />
    </>
  );
}
