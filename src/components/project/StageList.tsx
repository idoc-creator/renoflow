"use client";

import { useState, useCallback } from "react";
import { FiChevronDown, FiChevronRight, FiDollarSign, FiClock } from "react-icons/fi";
import { StepCard, type StepData } from "./StepCard";

const statusColors: Record<string, string> = {
  pending: "bg-cream text-warm-gray",
  in_progress: "bg-sage/20 text-sage-dark",
  completed: "bg-green-100 text-green-700",
  skipped: "bg-cream text-warm-gray",
};

export interface StageData {
  id: string;
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  actual_cost: number;
  estimated_hours: number;
  status: string;
  sort_order: number;
  steps: StepData[];
}

interface StageListProps {
  stages: StageData[];
}

export function StageList({ stages: initialStages }: StageListProps) {
  const [stages, setStages] = useState(initialStages);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(() => {
    // Auto-expand stages that have incomplete steps
    const expanded = new Set<string>();
    for (const stage of initialStages) {
      if (stage.steps.some((s) => !s.is_completed)) {
        expanded.add(stage.id);
        break; // only expand the first incomplete stage
      }
    }
    return expanded;
  });
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(
    new Set()
  );

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const toggleReason = (stageId: string) => {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  // Track which step is the "next" one across all stages
  const findFirstIncomplete = useCallback((): string | null => {
    for (const stage of stages) {
      for (const step of stage.steps) {
        if (!step.is_completed) return step.id;
      }
    }
    return null;
  }, [stages]);

  const nextStepId = findFirstIncomplete();

  const handleStepToggle = (stepId: string, completed: boolean) => {
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        steps: stage.steps.map((step) =>
          step.id === stepId ? { ...step, is_completed: completed } : step
        ),
      }))
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-charcoal">
        Your Plan ({stages.length} stages)
      </h2>

      {stages.map((stage, idx) => {
        const isExpanded = expandedStages.has(stage.id);
        const reasonExpanded = expandedReasons.has(stage.id);
        const completedSteps = stage.steps.filter((s) => s.is_completed).length;
        const totalSteps = stage.steps.length;
        const progressPct =
          totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        return (
          <div key={stage.id} className="rounded-xl bg-white shadow-sm">
            {/* Stage header — clickable to expand/collapse */}
            <button
              onClick={() => toggleStage(stage.id)}
              className="flex w-full items-start gap-3 p-5 text-left"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-charcoal">
                    {stage.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      statusColors[stage.status] || statusColors.pending
                    }`}
                  >
                    {stage.status?.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-warm-gray line-clamp-2">
                  {stage.description}
                </p>

                {/* Meta + progress */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-warm-gray">
                  <span className="flex items-center gap-1">
                    <FiDollarSign className="h-3 w-3" />$
                    {(stage.estimated_cost || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="h-3 w-3" />
                    {stage.estimated_hours}h
                  </span>
                  <span>
                    {completedSteps}/{totalSteps} steps
                  </span>
                </div>

                {/* Progress bar */}
                {totalSteps > 0 && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-sage/100 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="mt-1 text-warm-gray">
                {isExpanded ? (
                  <FiChevronDown className="h-5 w-5" />
                ) : (
                  <FiChevronRight className="h-5 w-5" />
                )}
              </span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-3">
                {/* Reason (collapsible) */}
                {stage.reason && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleReason(stage.id)}
                      className="flex items-center gap-1 text-xs font-medium text-warm-gray hover:text-charcoal"
                    >
                      {reasonExpanded ? (
                        <FiChevronDown className="h-3 w-3" />
                      ) : (
                        <FiChevronRight className="h-3 w-3" />
                      )}
                      Why this order
                    </button>
                    {reasonExpanded && (
                      <div className="mt-2 rounded-lg bg-cream p-3">
                        <p className="text-sm text-charcoal">{stage.reason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-2">
                  {stage.steps.map((step, sIdx) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      index={sIdx}
                      isNext={step.id === nextStepId}
                      onToggle={handleStepToggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
