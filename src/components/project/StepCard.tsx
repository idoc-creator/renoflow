"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FiClock,
  FiEdit2,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import StepEditForm, { type StepFormData } from "./StepEditForm";
import SubTaskList, { type SubTask } from "./SubTaskList";
import ConfirmDelete from "./ConfirmDelete";

const skillColors: Record<string, string> = {
  beginner: "bg-green-50 text-green-700",
  intermediate: "bg-terracotta/10 text-terracotta-dark",
  advanced: "bg-red-50 text-red-700",
  hire_out: "bg-purple-50 text-purple-700",
};

export interface StepData {
  id: string;
  title: string;
  description: string;
  skill_level: string;
  estimated_minutes: number;
  tools_needed: string[];
  materials_needed: unknown;
  sub_tasks: SubTask[];
  tips: string | null;
  is_completed: boolean;
  sort_order: number;
}

interface StepCardProps {
  step: StepData;
  index: number;
  total: number;
  isNext: boolean;
  projectId?: string;
  stageTitle?: string;
  onToggle: (stepId: string, completed: boolean) => void;
  onEdit: (stepId: string, data: StepFormData) => Promise<void>;
  onDelete: (stepId: string) => Promise<void>;
  onMove: (stepId: string, direction: "up" | "down") => Promise<void>;
  onUpdateSubTasks: (stepId: string, next: SubTask[]) => void | Promise<void>;
}

export function StepCard({
  step,
  index,
  total,
  isNext,
  projectId,
  stageTitle,
  onToggle,
  onEdit,
  onDelete,
  onMove,
  onUpdateSubTasks,
}: StepCardProps) {
  const [completed, setCompleted] = useState(step.is_completed);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const subTasks: SubTask[] = Array.isArray(step.sub_tasks)
    ? step.sub_tasks
    : [];
  const subCompleted = subTasks.filter((t) => t.is_completed).length;
  const subTotal = subTasks.length;
  const subProgressPct =
    subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

  async function handleToggle() {
    // If the step has sub-tasks, the step's completion is driven by them.
    // Manual toggle only makes sense when there are no sub-tasks.
    if (subTotal > 0) return;

    const newValue = !completed;
    setCompleted(newValue);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("steps")
      .update({
        is_completed: newValue,
        completed_at: newValue ? new Date().toISOString() : null,
      })
      .eq("id", step.id);

    if (error) {
      setCompleted(!newValue);
    } else {
      onToggle(step.id, newValue);
    }
    setLoading(false);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    await onDelete(step.id);
    setDeleteLoading(false);
    setDeleting(false);
  }

  if (editing) {
    return (
      <StepEditForm
        initial={step}
        projectId={projectId}
        stageTitle={stageTitle}
        onSave={async (data) => {
          await onEdit(step.id, data);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        saveLabel="Save changes"
      />
    );
  }

  // Step is considered visually "done" if either:
  // - no sub-tasks and is_completed=true
  // - has sub-tasks and all are complete
  const visuallyDone =
    subTotal > 0 ? subCompleted === subTotal : completed;

  return (
    <>
      <div
        className={`flex gap-2 rounded-lg border p-3 transition-colors ${
          isNext && !visuallyDone
            ? "border-sage/40 bg-sage/5"
            : visuallyDone
              ? "border-border-warm bg-cream"
              : "border-border-warm"
        }`}
      >
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 shrink-0 pt-1">
          <button
            onClick={() => onMove(step.id, "up")}
            disabled={index === 0}
            className="text-warm-gray hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            <FiArrowUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => onMove(step.id, "down")}
            disabled={index === total - 1}
            className="text-warm-gray hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move down"
          >
            <FiArrowDown className="h-3 w-3" />
          </button>
        </div>

        {/* Step checkbox — manual only when no sub-tasks */}
        <button
          onClick={handleToggle}
          disabled={loading || subTotal > 0}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            visuallyDone
              ? "border-sage bg-sage text-white"
              : "border-border-warm hover:border-sage disabled:hover:border-border-warm"
          } ${subTotal > 0 ? "cursor-default" : ""}`}
          aria-label={
            subTotal > 0
              ? "Complete sub-tasks to finish this step"
              : visuallyDone
                ? "Mark incomplete"
                : "Mark complete"
          }
        >
          {visuallyDone && (
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-warm-gray">
              {index + 1}
            </span>
            <p
              className={`font-medium text-sm ${
                visuallyDone ? "text-warm-gray line-through" : "text-charcoal"
              }`}
            >
              {step.title}
            </p>
            {isNext && !visuallyDone && (
              <span className="rounded-full bg-sage px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                Next
              </span>
            )}
          </div>

          {step.description && (
            <p className="mt-0.5 text-xs text-warm-gray">
              {step.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            {step.skill_level && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  skillColors[step.skill_level] || "bg-cream text-charcoal"
                }`}
              >
                {step.skill_level?.replace("_", " ")}
              </span>
            )}
            {step.estimated_minutes > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-warm-gray">
                <FiClock className="h-2.5 w-2.5" />~{step.estimated_minutes}{" "}
                min
              </span>
            )}
          </div>

          {/* Sub-task progress */}
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
                  style={{ width: `${subProgressPct}%` }}
                />
              </div>
              <div className="mt-2">
                <SubTaskList
                  subTasks={subTasks}
                  onChange={(next) => onUpdateSubTasks(step.id, next)}
                  editable={false}
                />
              </div>
            </div>
          )}

          {step.tools_needed?.length > 0 && (
            <p className="mt-2 text-[10px] text-warm-gray">
              Tools: {step.tools_needed.join(", ")}
            </p>
          )}

          {step.tips && step.tips.trim() && (
            <div className="mt-2 rounded-md bg-sage/5 border border-sage/20 p-2 text-[11px] text-charcoal whitespace-pre-wrap">
              {step.tips}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-start gap-0.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-warm-gray hover:text-charcoal hover:bg-cream rounded transition-colors"
            aria-label="Edit step"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleting(true)}
            className="p-1.5 text-warm-gray hover:text-terracotta hover:bg-terracotta/10 rounded transition-colors"
            aria-label="Delete step"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDelete
        open={deleting}
        title="Delete this step?"
        message="This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
        loading={deleteLoading}
      />
    </>
  );
}
