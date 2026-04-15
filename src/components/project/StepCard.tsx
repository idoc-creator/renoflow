"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FiClock } from "react-icons/fi";

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
  isNext: boolean;
  onToggle: (stepId: string, completed: boolean) => void;
}

export function StepCard({ step, index, isNext, onToggle }: StepCardProps) {
  const [completed, setCompleted] = useState(step.is_completed);
  const [loading, setLoading] = useState(false);

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
      setCompleted(!newValue); // revert on error
    } else {
      onToggle(step.id, newValue);
    }
    setLoading(false);
  }

  return (
    <div
      className={`flex gap-3 rounded-lg border p-3 transition-colors ${
        isNext && !completed
          ? "border-teal-300 bg-sage/10/50"
          : completed
            ? "border-slate-100 bg-cream"
            : "border-slate-100"
      }`}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          completed
            ? "border-teal-500 bg-sage/100 text-white"
            : "border-border-warm hover:border-teal-400"
        }`}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      >
        {completed && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
        <p
          className={`mt-0.5 text-xs ${
            completed ? "text-slate-300" : "text-warm-gray"
          }`}
        >
          {step.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
              skillColors[step.skill_level] || "bg-cream text-charcoal"
            }`}
          >
            {step.skill_level?.replace("_", " ")}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-warm-gray">
            <FiClock className="h-2.5 w-2.5" />~{step.estimated_minutes} min
          </span>
        </div>
        {step.tools_needed?.length > 0 && (
          <p className="mt-1 text-[10px] text-warm-gray">
            Tools: {step.tools_needed.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
