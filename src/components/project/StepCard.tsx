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
  is_completed: boolean;
  sort_order: number;
}

interface StepCardProps {
  step: StepData;
  index: number;
  total: number;
  isNext: boolean;
  onToggle: (stepId: string, completed: boolean) => void;
  onEdit: (stepId: string, data: StepFormData) => Promise<void>;
  onDelete: (stepId: string) => Promise<void>;
  onMove: (stepId: string, direction: "up" | "down") => Promise<void>;
}

export function StepCard({
  step,
  index,
  total,
  isNext,
  onToggle,
  onEdit,
  onDelete,
  onMove,
}: StepCardProps) {
  const [completed, setCompleted] = useState(step.is_completed);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleToggle() {
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
        onSave={async (data) => {
          await onEdit(step.id, data);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        saveLabel="Save changes"
      />
    );
  }

  return (
    <>
      <div
        className={`flex gap-2 rounded-lg border p-3 transition-colors ${
          isNext && !completed
            ? "border-sage/40 bg-sage/5"
            : completed
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

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            completed
              ? "border-sage bg-sage text-white"
              : "border-border-warm hover:border-sage"
          }`}
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
        >
          {completed && (
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
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-warm-gray">
              {index + 1}
            </span>
            <p
              className={`font-medium text-sm ${
                completed ? "text-warm-gray line-through" : "text-charcoal"
              }`}
            >
              {step.title}
            </p>
            {isNext && !completed && (
              <span className="rounded-full bg-sage px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                Next
              </span>
            )}
          </div>
          {step.description && (
            <p
              className={`mt-0.5 text-xs ${
                completed ? "text-warm-gray" : "text-warm-gray"
              }`}
            >
              {step.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                skillColors[step.skill_level] || "bg-cream text-charcoal"
              }`}
            >
              {step.skill_level?.replace("_", " ")}
            </span>
            {step.estimated_minutes > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-warm-gray">
                <FiClock className="h-2.5 w-2.5" />~{step.estimated_minutes} min
              </span>
            )}
          </div>
          {step.tools_needed?.length > 0 && (
            <p className="mt-1 text-[10px] text-warm-gray">
              Tools: {step.tools_needed.join(", ")}
            </p>
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
