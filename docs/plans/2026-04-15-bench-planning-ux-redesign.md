# Bench Planning UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship Priority 1 of the planning UX redesign — frictionless stage/step creation with sub-tasks and a "Rough it in" AI fill-gaps button.

**Architecture:** Add `sub_tasks jsonb` and `tips text` columns to `steps`. Simplify `StageEditForm` and `StepEditForm` to require only titles. Add a new `SubTaskList` editor component inline in step form. Add a `RoughItInPreview` modal that calls a new `/api/ai/fill-step` endpoint (Claude Haiku) and merges accepted suggestions back into the step form. Auto-complete a step when all its sub-tasks are checked.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase client (browser CRUD), `@anthropic-ai/sdk` (Claude Haiku for fill-gaps).

**Reference design doc:** `/Users/codiguild/Documents/Obsidian Vault/docs/plans/2026-04-15-bench-planning-redesign.md`

---

## Context

Codi tested the current manual planning UX on her real bathroom remodel and gave 10 friction points. The root cause: the forms ask for outputs as inputs — stage cost, skill level, "why this order" — things a user only knows after they've worked through the steps. The UX forces premature commitment and creates blank-page paralysis. This redesign strips the forms down to just titles, introduces sub-task checklists (her main missing primitive), and adds an optional "Rough it in" button that uses AI to draft the rough version from just the title — she edits the finish work. Priorities 2 (materials/PPE), 3 (toolbox), and 4 (skeleton defaults) are documented in the design doc but deferred to future sessions.

---

## Task 1: Database migration + fetch updates

**Files:**
- Migration: apply via Supabase MCP (`apply_migration`)
- Modify: `src/app/bunker/project/[id]/page.tsx` (select columns)

**Step 1: Apply migration**

Run via `mcp__5d88bc36-44c3-4867-901c-ad70d0f3d761__apply_migration`:
- project_id: `swkciedujchgndomcxrj`
- name: `add_sub_tasks_and_tips`
- query:
```sql
alter table public.steps add column if not exists sub_tasks jsonb default '[]'::jsonb;
alter table public.steps add column if not exists tips text;
```

**Step 2: Verify columns exist**

Run `mcp__5d88bc36-44c3-4867-901c-ad70d0f3d761__list_tables` with `verbose: true` and confirm `steps` has `sub_tasks` and `tips` columns.

**Step 3: Update StepData type in StepCard.tsx**

Add `sub_tasks: SubTask[]` and `tips: string | null` to the `StepData` interface. Also create a new shared type file or inline the SubTask type:

```typescript
export interface SubTask {
  id: string;
  title: string;
  is_completed: boolean;
}
```

**Step 4: Verify build**

Run `cd /Users/codiguild/renoflow && npm run build` — must pass.

**Step 5: Commit**

```bash
cd /Users/codiguild/renoflow && git add -A && git commit -m "feat(bench): add sub_tasks and tips columns to steps"
```

---

## Task 2: Strip down the Stage form

**Files:**
- Modify: `src/components/project/StageEditForm.tsx`
- Modify: `src/components/project/StageList.tsx` (`handleCreateStage`, `handleUpdateStage`, stage card pill rendering)

**Step 1: Simplify StageEditForm**

Replace the form body with:
- `title` field (required)
- `description` textarea (optional, small, placeholder "Optional — brief description")
- No `reason`, `estimated_cost`, `estimated_hours` inputs

Keep the `StageFormData` type but make cost/hours/reason optional in the outgoing object (default them to 0/"" in the save handler). Do NOT break the template clone flow which uses `createFromPlan`.

```typescript
export interface StageFormData {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
}

// In the form: return { title, description, reason: "", estimated_cost: 0, estimated_hours: 0 }
// unless the initial prop had values, in which case preserve them for editing.
```

**Step 2: Update StageList handlers**

`handleCreateStage` and `handleUpdateStage` already accept `StageFormData` — no signature change needed. Just ensure passing `reason: ""` / `estimated_cost: 0` / `estimated_hours: 0` works (the DB schema allows nulls but we'll pass 0/empty string which is fine).

**Step 3: Remove stage card `$0 · 0h` pill**

In `StageList.tsx`, find the stage card header meta row (near `FiDollarSign`). Remove the dollar and hours spans. Keep the `X/Y steps` display.

**Step 4: Verify build + visual check**

```bash
npm run build
```

Then in preview: navigate to `/bunker/project/<id>`, click "Add stage", verify only title + description fields appear, verify the existing Stage 1 card no longer shows `$0 · 0h`.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(bench): strip stage form to title-only (description optional)"
```

---

## Task 3: Build the SubTaskList component

**Files:**
- Create: `src/components/project/SubTaskList.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";

export interface SubTask {
  id: string;
  title: string;
  is_completed: boolean;
}

interface SubTaskListProps {
  subTasks: SubTask[];
  onChange: (next: SubTask[]) => void;
  editable?: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function SubTaskList({
  subTasks,
  onChange,
  editable = true,
}: SubTaskListProps) {
  const [draftTitle, setDraftTitle] = useState("");

  function addSubTask() {
    if (!draftTitle.trim()) return;
    onChange([
      ...subTasks,
      { id: generateId(), title: draftTitle.trim(), is_completed: false },
    ]);
    setDraftTitle("");
  }

  function updateSubTask(id: string, patch: Partial<SubTask>) {
    onChange(subTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeSubTask(id: string) {
    onChange(subTasks.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-2">
      {subTasks.length === 0 && editable && (
        <p className="text-xs text-warm-gray italic">
          Break this step into a checklist — add sub-tasks below.
        </p>
      )}
      {subTasks.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 rounded-md bg-white border border-border-warm px-3 py-2"
        >
          <input
            type="checkbox"
            checked={t.is_completed}
            onChange={(e) =>
              updateSubTask(t.id, { is_completed: e.target.checked })
            }
            className="accent-sage shrink-0"
          />
          {editable ? (
            <input
              type="text"
              value={t.title}
              onChange={(e) => updateSubTask(t.id, { title: e.target.value })}
              className="flex-1 bg-transparent text-sm text-charcoal focus:outline-none"
            />
          ) : (
            <span
              className={`flex-1 text-sm ${
                t.is_completed ? "text-warm-gray line-through" : "text-charcoal"
              }`}
            >
              {t.title}
            </span>
          )}
          {editable && (
            <button
              type="button"
              onClick={() => removeSubTask(t.id)}
              className="shrink-0 text-warm-gray hover:text-terracotta"
              aria-label="Remove sub-task"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {editable && (
        <div className="flex gap-2">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubTask();
              }
            }}
            placeholder="Add a sub-task and press Enter"
            className="flex-1 px-3 py-2 bg-cream rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
          <button
            type="button"
            onClick={addSubTask}
            disabled={!draftTitle.trim()}
            className="flex items-center gap-1 rounded-md bg-sage/20 px-3 py-2 text-xs font-semibold text-sage-dark hover:bg-sage/30 disabled:opacity-50"
          >
            <FiPlus className="h-3 w-3" />
            Add
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(bench): SubTaskList editor component"
```

---

## Task 4: Create the AI fill-step endpoint

**Files:**
- Create: `src/app/api/ai/fill-step/route.ts`

**Step 1: Write the endpoint**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Bench, a DIY coach helping someone plan the details of a single step in their project. They'll give you a step title (and maybe project context). You return practical, specific content they can use immediately.

Return these fields:
- subTasks: 4-10 concrete micro-actions in the order they should be done. Plain, short titles. No numbering.
- tools: 3-8 tools needed, lowercase names. Include hand tools and power tools. Don't include PPE here.
- tips: 2-5 short practical tips and best practices for this specific step. Safety notes, tricks, common mistakes.

Be practical, not generic. Match the user's project context. If the step involves electrical, plumbing, or structural work and the project context suggests the user is a beginner, include a tip about when to call a pro.`;

const FILL_STEP_SCHEMA = {
  type: "object" as const,
  properties: {
    subTasks: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    tools: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    tips: {
      type: "array" as const,
      items: { type: "string" as const },
    },
  },
  required: ["subTasks", "tools", "tips"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { stepTitle, projectId, stageTitle } = body as {
    stepTitle: string;
    projectId?: string;
    stageTitle?: string;
  };

  if (!stepTitle || typeof stepTitle !== "string") {
    return Response.json(
      { error: "stepTitle is required" },
      { status: 400 }
    );
  }

  let projectContext = "";
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("name, category, description")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    if (project) {
      projectContext = `Project: ${project.name}${project.category ? ` (${project.category})` : ""}. ${project.description ?? ""}`;
    }
  }

  const userMessage = `Step title: "${stepTitle}"
${stageTitle ? `Stage: ${stageTitle}` : ""}
${projectContext ? projectContext : ""}

Fill in the details for this step.`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: FILL_STEP_SCHEMA,
        },
      },
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response");
    }

    const parsed = JSON.parse(textBlock.text);
    return Response.json(parsed);
  } catch (error) {
    console.error("Fill step error:", error);
    return Response.json(
      { error: "Couldn't rough it in. Try again." },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(bench): AI fill-step endpoint using Haiku"
```

---

## Task 5: Build the RoughItInPreview modal

**Files:**
- Create: `src/components/project/RoughItInPreview.tsx`

**Step 1: Write the component**

```typescript
"use client";

import { useState, useEffect } from "react";
import { FiX, FiTool } from "react-icons/fi";

interface Suggestion {
  id: string;
  text: string;
  accepted: boolean;
}

interface RoughItInPreviewProps {
  open: boolean;
  stepTitle: string;
  stageTitle?: string;
  projectId?: string;
  onClose: () => void;
  onAccept: (accepted: {
    subTasks: string[];
    tools: string[];
    tips: string[];
  }) => void;
}

function asSuggestions(items: string[]): Suggestion[] {
  return items.map((t, i) => ({
    id: `${i}-${Math.random().toString(36).slice(2, 6)}`,
    text: t,
    accepted: true,
  }));
}

export default function RoughItInPreview({
  open,
  stepTitle,
  stageTitle,
  projectId,
  onClose,
  onAccept,
}: RoughItInPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subTasks, setSubTasks] = useState<Suggestion[]>([]);
  const [tools, setTools] = useState<Suggestion[]>([]);
  const [tips, setTips] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!open || !stepTitle) return;
    let cancelled = false;

    async function fetchSuggestions() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/fill-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepTitle, stageTitle, projectId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to rough it in.");
        }
        const data = await res.json();
        if (cancelled) return;
        setSubTasks(asSuggestions(data.subTasks ?? []));
        setTools(asSuggestions(data.tools ?? []));
        setTips(asSuggestions(data.tips ?? []));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [open, stepTitle, stageTitle, projectId]);

  function toggle(
    list: Suggestion[],
    setList: (next: Suggestion[]) => void,
    id: string
  ) {
    setList(list.map((s) => (s.id === id ? { ...s, accepted: !s.accepted } : s)));
  }

  function handleAccept() {
    onAccept({
      subTasks: subTasks.filter((s) => s.accepted).map((s) => s.text),
      tools: tools.filter((s) => s.accepted).map((s) => s.text),
      tips: tips.filter((s) => s.accepted).map((s) => s.text),
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/30 p-4">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-cream border border-border-warm shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-warm-gray hover:text-charcoal"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <FiTool className="h-5 w-5 text-terracotta" />
            <h2 className="font-serif text-2xl text-charcoal">
              Rough it in
            </h2>
          </div>
          <p className="text-warm-gray text-sm mb-6">
            Suggestions for: <span className="font-semibold">{stepTitle}</span>
          </p>

          {loading && (
            <div className="py-12 text-center">
              <p className="text-warm-gray text-sm">
                Bench is thinking through this step...
              </p>
            </div>
          )}

          {error && (
            <p className="text-terracotta text-sm bg-terracotta/10 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {subTasks.length > 0 && (
                <Section
                  label="Sub-tasks"
                  items={subTasks}
                  onToggle={(id) => toggle(subTasks, setSubTasks, id)}
                />
              )}
              {tools.length > 0 && (
                <Section
                  label="Tools"
                  items={tools}
                  onToggle={(id) => toggle(tools, setTools, id)}
                />
              )}
              {tips.length > 0 && (
                <Section
                  label="Tips"
                  items={tips}
                  onToggle={(id) => toggle(tips, setTips, id)}
                />
              )}
            </div>
          )}

          {!loading && !error && (
            <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border-warm">
              <button
                type="button"
                onClick={handleAccept}
                className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Accept selections
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-warm-gray hover:text-charcoal text-sm px-3 py-2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  items,
  onToggle,
}: {
  label: string;
  items: Suggestion[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-warm-gray mb-2">
        {label}
      </h3>
      <div className="space-y-1.5">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-white"
          >
            <input
              type="checkbox"
              checked={item.accepted}
              onChange={() => onToggle(item.id)}
              className="mt-0.5 accent-terracotta shrink-0"
            />
            <span className="text-sm text-charcoal">{item.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(bench): RoughItInPreview modal for AI step suggestions"
```

---

## Task 6: Strip down the Step form + add sub-tasks + Rough it in

**Files:**
- Modify: `src/components/project/StepEditForm.tsx`

**Step 1: Update StepFormData type**

Add `sub_tasks: SubTask[]` and `tips: string | null` to `StepFormData`:

```typescript
import type { SubTask } from "./SubTaskList";

export interface StepFormData {
  title: string;
  description: string;
  skill_level: string;
  estimated_minutes: number;
  tools_needed: string[];
  sub_tasks: SubTask[];
  tips: string | null;
}
```

**Step 2: Rewrite the form body**

Replace the entire `StepEditForm` component with:
- Title input (required, autoFocus)
- `<SubTaskList>` component wired to local state
- **"Rough it in"** button that opens `<RoughItInPreview>`
- Collapsed "Advanced" section (toggled open/closed) containing: description, skill level, estimated minutes, tools (comma-separated text)
- Save/Cancel buttons at bottom

```typescript
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

        {/* Tips (read-only preview if present) */}
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
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(bench): step form with sub-tasks, Rough it in button, advanced collapse"
```

---

## Task 7: Wire sub_tasks + tips through StageList handlers

**Files:**
- Modify: `src/components/project/StageList.tsx` (`handleCreateStep`, `handleUpdateStep`, StepCard usage)
- Modify: `src/components/project/AddStepButton.tsx` (pass stageTitle + projectId to form)

**Step 1: Update AddStepButton props**

Add `stageTitle?: string` and `projectId?: string` props, pass them through to `StepEditForm`.

```typescript
interface AddStepButtonProps {
  onCreate: (data: StepFormData) => void | Promise<void>;
  stageTitle?: string;
  projectId?: string;
}
```

Pass these to `<StepEditForm>`.

**Step 2: Update StageList `handleCreateStep` to persist sub_tasks and tips**

In `src/components/project/StageList.tsx`, find `handleCreateStep` and add the new fields to the insert:

```typescript
const { data: inserted, error } = await supabase
  .from("steps")
  .insert({
    stage_id: stageId,
    title: data.title,
    description: data.description,
    skill_level: data.skill_level,
    estimated_minutes: data.estimated_minutes,
    tools_needed: data.tools_needed,
    materials_needed: [],
    sub_tasks: data.sub_tasks,
    tips: data.tips,
    sort_order: maxSort + 1,
    is_completed: false,
  })
  .select("*")
  .single();
```

**Step 3: Update `handleUpdateStep` similarly**

```typescript
const { error } = await supabase
  .from("steps")
  .update({
    title: data.title,
    description: data.description,
    skill_level: data.skill_level,
    estimated_minutes: data.estimated_minutes,
    tools_needed: data.tools_needed,
    sub_tasks: data.sub_tasks,
    tips: data.tips,
  })
  .eq("id", stepId);
```

Update the optimistic local state update to include sub_tasks and tips.

**Step 4: Pass stageTitle + projectId through to AddStepButton**

In the `StageList.tsx` render, change:
```tsx
<AddStepButton
  onCreate={(data) => handleCreateStep(stage.id, data)}
/>
```
to:
```tsx
<AddStepButton
  onCreate={(data) => handleCreateStep(stage.id, data)}
  stageTitle={stage.title}
  projectId={projectId}
/>
```

**Step 5: Pass stageTitle + projectId to StepCard (it renders StepEditForm when editing)**

Update `StepCard` props to accept `stageTitle?: string` and `projectId?: string`, thread them down to the embedded `<StepEditForm>`. Update the StepCard call site in StageList to pass these.

**Step 6: Verify build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(bench): persist sub_tasks and tips through step CRUD"
```

---

## Task 8: Sub-task progress on the step card + auto-complete logic

**Files:**
- Modify: `src/components/project/StepCard.tsx`
- Modify: `src/components/project/StageList.tsx` (pass sub_tasks through, handle auto-complete sync)

**Step 1: Show sub-task progress on the step card**

In `StepCard.tsx`, when not editing, add a sub-task progress display below the existing description row:

```typescript
const subTasks = (step.sub_tasks ?? []) as SubTask[];
const subCompleted = subTasks.filter((t) => t.is_completed).length;
const subTotal = subTasks.length;
```

Render right after the skill/time row:

```tsx
{subTotal > 0 && (
  <div className="mt-2">
    <div className="flex items-center justify-between text-[10px] text-warm-gray mb-1">
      <span>
        {subCompleted} of {subTotal} sub-tasks
      </span>
    </div>
    <div className="h-1 w-full overflow-hidden rounded-full bg-cream">
      <div
        className="h-full bg-sage transition-all duration-300"
        style={{
          width: `${subTotal > 0 ? (subCompleted / subTotal) * 100 : 0}%`,
        }}
      />
    </div>
  </div>
)}
```

Import `SubTask` at top from `./SubTaskList`. Add `sub_tasks: SubTask[]` and `tips: string | null` to `StepData` interface.

**Step 2: Render editable sub-tasks when the step card is expanded (non-edit mode)**

For now, the simplest path: show a read-only list of sub-tasks with checkboxes that the user can toggle. This lets Codi actually use sub-tasks to track progress without entering edit mode. Add this below the progress bar:

```tsx
{subTotal > 0 && (
  <SubTaskList
    subTasks={subTasks}
    onChange={(next) => onUpdateSubTasks(step.id, next)}
    editable={false}
  />
)}
```

**Step 3: Add `onUpdateSubTasks` prop and handler**

Update `StepCardProps` to include `onUpdateSubTasks: (stepId: string, next: SubTask[]) => void | Promise<void>`.

In `StageList.tsx`, add a new handler:

```typescript
async function handleUpdateSubTasks(stepId: string, next: SubTask[]) {
  // Optimistic update
  setStages((prev) =>
    prev.map((stage) => ({
      ...stage,
      steps: stage.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              sub_tasks: next,
              // Auto-complete the step if all sub-tasks are done
              is_completed:
                next.length > 0 && next.every((t) => t.is_completed)
                  ? true
                  : next.length > 0
                    ? false
                    : step.is_completed,
            }
          : step
      ),
    }))
  );

  const allDone = next.length > 0 && next.every((t) => t.is_completed);
  const { error } = await supabase
    .from("steps")
    .update({
      sub_tasks: next,
      is_completed: next.length > 0 ? allDone : undefined,
      completed_at: allDone ? new Date().toISOString() : null,
    })
    .eq("id", stepId);

  if (error) {
    console.error("Failed to update sub-tasks", error);
  }
}
```

Pass `onUpdateSubTasks={handleUpdateSubTasks}` to `<StepCard>`.

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(bench): sub-task progress bar and auto-complete on step card"
```

---

## Task 9: End-to-end verification + push

**Step 1: Type + lint + build**

```bash
cd /Users/codiguild/renoflow && npm run build && npx tsc --noEmit && npm run lint
```

All must pass. ESLint may have pre-existing `<img>` warnings — ignore those.

**Step 2: Visual test in preview**

The dev server should still be running. If not, restart via `preview_start`. Walk through:

1. Navigate to `/bunker/project/1f9ba58f-cb4a-4c9d-a62e-5349a9e93b61` (Bathroom Remodel)
2. Click the existing Stage 1's edit button → confirm the form only shows title and (optional) description
3. Edit title to "Demo" → save → confirm no `$0 · 0h` pill
4. Click "Add step" → confirm only title is required
5. Type "Demo the existing shower" → click **"Rough it in"** → preview modal opens → AI responds (~5-10s) with sub-tasks, tools, tips
6. Uncheck 1-2 sub-tasks → click "Accept selections"
7. Confirm sub-tasks appear in the form, tools merged into tools field, tips shown in a sage-tinted box
8. Click "Add step" (the save button) → step appears in the list
9. Expand the step → confirm sub-task progress bar shows `0 of N`
10. Check a sub-task → confirm progress bar updates
11. Check all sub-tasks → confirm step auto-completes (strikethrough)

If any step fails, fix and re-test.

**Step 3: Push to PR**

```bash
cd /Users/codiguild/renoflow && git push origin feat/bench-rebuild
```

**Step 4: Final commit if anything was adjusted during verification**

Only commit if something needed fixing.

---

## Verification Summary

After all tasks, Codi should be able to:
- Create a stage by typing only a title
- Create a step by typing only a title
- Add sub-tasks inline with Enter key
- Click "Rough it in" and get real, specific suggestions for her bathroom remodel steps
- Accept/reject suggestions individually
- See sub-task progress on the step card
- Auto-complete a step by checking all its sub-tasks
- Use the advanced fields only when she wants to

---

## Out of Scope (Future Priorities)

- Priority 2: Materials + PPE per step, calculated stage costs
- Priority 3: User-wide Toolbox with persistent tools and reorder tracking
- Priority 4: Skeleton stage defaults for common project types
- Build mode: swipe-through execution interface
- Expert verification economy
