"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiChevronDown,
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { StepCard, type StepData } from "./StepCard";
import { createClient } from "@/lib/supabase/client";
import EmptyPlanState from "./EmptyPlanState";
import AddStageButton from "./AddStageButton";
import StageEditForm, { type StageFormData } from "./StageEditForm";
import ConfirmDelete from "./ConfirmDelete";
import AddStepButton from "./AddStepButton";
import type { StepFormData } from "./StepEditForm";
import type { StepTool } from "./ToolPicker";
import type { SubTask } from "./SubTaskList";

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
  projectId: string;
}

export function StageList({
  stages: initialStages,
  projectId,
}: StageListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [stages, setStages] = useState(initialStages);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    for (const stage of initialStages) {
      if (stage.steps.some((s) => !s.is_completed)) {
        expanded.add(stage.id);
        break;
      }
    }
    return expanded;
  });
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(
    new Set()
  );
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  async function handleStartBlank() {
    const { error } = await supabase.from("stages").insert({
      project_id: projectId,
      title: "Stage 1",
      description: "",
      reason: "",
      estimated_cost: 0,
      estimated_hours: 0,
      sort_order: 0,
      status: "pending",
    });
    if (!error) {
      router.refresh();
    }
  }

  async function handleCreateStage(data: StageFormData) {
    const maxSort = stages.reduce(
      (m, s) => Math.max(m, s.sort_order),
      -1
    );
    const { data: inserted, error } = await supabase
      .from("stages")
      .insert({
        project_id: projectId,
        title: data.title,
        description: data.description,
        reason: data.reason,
        estimated_cost: data.estimated_cost,
        estimated_hours: data.estimated_hours,
        sort_order: maxSort + 1,
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !inserted) {
      alert("Failed to create stage. Try again.");
      return;
    }
    setStages((prev) => [
      ...prev,
      { ...(inserted as StageData), steps: [] },
    ]);
  }

  async function handleUpdateStage(stageId: string, data: StageFormData) {
    const { error } = await supabase
      .from("stages")
      .update({
        title: data.title,
        description: data.description,
        reason: data.reason,
        estimated_cost: data.estimated_cost,
        estimated_hours: data.estimated_hours,
      })
      .eq("id", stageId);

    if (error) {
      alert("Failed to save changes.");
      return;
    }
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? {
              ...s,
              title: data.title,
              description: data.description,
              reason: data.reason,
              estimated_cost: data.estimated_cost,
              estimated_hours: data.estimated_hours,
            }
          : s
      )
    );
    setEditingStageId(null);
  }

  async function handleDeleteStage(stageId: string) {
    setDeleteLoading(true);
    const { error } = await supabase.from("stages").delete().eq("id", stageId);
    setDeleteLoading(false);
    if (error) {
      alert("Failed to delete stage.");
      return;
    }
    setStages((prev) => prev.filter((s) => s.id !== stageId));
    setDeletingStageId(null);
  }

  async function handleCreateStep(stageId: string, data: StepFormData) {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    const maxSort = stage.steps.reduce(
      (m, s) => Math.max(m, s.sort_order),
      -1
    );

    const allSubDone =
      data.sub_tasks.length > 0 &&
      data.sub_tasks.every((t) => t.is_completed);

    const { data: inserted, error } = await supabase
      .from("steps")
      .insert({
        stage_id: stageId,
        title: data.title,
        description: data.description,
        // DB check constraint rejects empty strings — pass null for "not set"
        skill_level: data.skill_level || null,
        estimated_minutes: data.estimated_minutes,
        tools_needed: data.tools_needed,
        step_tools: data.step_tools,
        materials_needed: [],
        sub_tasks: data.sub_tasks,
        tips: data.tips,
        sort_order: maxSort + 1,
        is_completed: allSubDone,
      })
      .select("*")
      .single();

    if (error || !inserted) {
      console.error("Failed to create step:", error);
      alert(`Failed to create step: ${error?.message ?? "unknown error"}`);
      return;
    }

    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? { ...s, steps: [...s.steps, inserted as StepData] }
          : s
      )
    );
  }

  async function handleUpdateStep(stepId: string, data: StepFormData) {
    const allSubDone =
      data.sub_tasks.length > 0 &&
      data.sub_tasks.every((t) => t.is_completed);

    const { error } = await supabase
      .from("steps")
      .update({
        title: data.title,
        description: data.description,
        // DB check constraint rejects empty strings — pass null for "not set"
        skill_level: data.skill_level || null,
        estimated_minutes: data.estimated_minutes,
        tools_needed: data.tools_needed,
        step_tools: data.step_tools,
        sub_tasks: data.sub_tasks,
        tips: data.tips,
        is_completed:
          data.sub_tasks.length > 0 ? allSubDone : undefined,
      })
      .eq("id", stepId);

    if (error) {
      console.error("Failed to save step:", error);
      alert(`Failed to save step: ${error.message}`);
      return;
    }

    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        steps: stage.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                title: data.title,
                description: data.description,
                skill_level: data.skill_level,
                estimated_minutes: data.estimated_minutes,
                tools_needed: data.tools_needed,
                step_tools: data.step_tools,
                sub_tasks: data.sub_tasks,
                tips: data.tips,
                is_completed:
                  data.sub_tasks.length > 0
                    ? allSubDone
                    : step.is_completed,
              }
            : step
        ),
      }))
    );
  }

  async function handleDeleteStep(stepId: string) {
    const { error } = await supabase.from("steps").delete().eq("id", stepId);
    if (error) {
      alert("Failed to delete step.");
      return;
    }
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        steps: stage.steps.filter((s) => s.id !== stepId),
      }))
    );
  }

  async function handleUpdateSubTasks(stepId: string, next: SubTask[]) {
    const allDone = next.length > 0 && next.every((t) => t.is_completed);

    // Optimistic update
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        steps: stage.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                sub_tasks: next,
                is_completed:
                  next.length > 0 ? allDone : step.is_completed,
              }
            : step
        ),
      }))
    );

    const updatePayload: {
      sub_tasks: SubTask[];
      is_completed?: boolean;
      completed_at?: string | null;
    } = { sub_tasks: next };

    if (next.length > 0) {
      updatePayload.is_completed = allDone;
      updatePayload.completed_at = allDone ? new Date().toISOString() : null;
    }

    const { error } = await supabase
      .from("steps")
      .update(updatePayload)
      .eq("id", stepId);

    if (error) {
      console.error("Failed to update sub-tasks", error);
    }
  }

  async function handleMoveStep(stepId: string, direction: "up" | "down") {
    // Find which stage contains the step
    const stage = stages.find((s) => s.steps.some((st) => st.id === stepId));
    if (!stage) return;
    const index = stage.steps.findIndex((s) => s.id === stepId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stage.steps.length) return;

    const a = stage.steps[index];
    const b = stage.steps[targetIndex];

    // Optimistic update
    const newSteps = [...stage.steps];
    newSteps[index] = { ...b, sort_order: a.sort_order };
    newSteps[targetIndex] = { ...a, sort_order: b.sort_order };
    setStages((prev) =>
      prev.map((s) =>
        s.id === stage.id ? { ...s, steps: newSteps } : s
      )
    );

    const { error: e1 } = await supabase
      .from("steps")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from("steps")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id);

    if (e1 || e2) {
      alert("Failed to reorder step. Refreshing.");
      router.refresh();
    }
  }

  async function handleMoveStage(stageId: string, direction: "up" | "down") {
    const index = stages.findIndex((s) => s.id === stageId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const a = stages[index];
    const b = stages[targetIndex];

    // Optimistic update
    const newStages = [...stages];
    newStages[index] = { ...b, sort_order: a.sort_order };
    newStages[targetIndex] = { ...a, sort_order: b.sort_order };
    setStages(newStages);

    // Swap sort_order in DB
    const { error: e1 } = await supabase
      .from("stages")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from("stages")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id);

    if (e1 || e2) {
      alert("Failed to reorder. Refreshing.");
      router.refresh();
    }
  }

  // Empty state
  if (stages.length === 0) {
    return <EmptyPlanState projectId={projectId} onStartBlank={handleStartBlank} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-charcoal">
          Your Plan ({stages.length} stage{stages.length === 1 ? "" : "s"})
        </h2>
      </div>

      {stages.map((stage, idx) => {
        const isExpanded = expandedStages.has(stage.id);
        const reasonExpanded = expandedReasons.has(stage.id);
        const isEditing = editingStageId === stage.id;
        const completedSteps = stage.steps.filter((s) => s.is_completed).length;
        const totalSteps = stage.steps.length;
        const progressPct =
          totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        return (
          <div key={stage.id} className="rounded-xl bg-white shadow-sm">
            {isEditing ? (
              <StageEditForm
                initial={stage}
                onSave={(data) => handleUpdateStage(stage.id, data)}
                onCancel={() => setEditingStageId(null)}
                saveLabel="Save changes"
              />
            ) : (
              <>
                {/* Stage header row with controls */}
                <div className="flex items-start gap-3 p-5">
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5 mt-1 shrink-0">
                    <button
                      onClick={() => handleMoveStage(stage.id, "up")}
                      disabled={idx === 0}
                      className="text-warm-gray hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <FiArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMoveStage(stage.id, "down")}
                      disabled={idx === stages.length - 1}
                      className="text-warm-gray hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <FiArrowDown className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">
                    {idx + 1}
                  </span>

                  {/* Clickable header body */}
                  <button
                    onClick={() => toggleStage(stage.id)}
                    className="flex-1 min-w-0 text-left"
                  >
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
                    {stage.description && (
                      <p className="mt-1 text-sm text-warm-gray line-clamp-2">
                        {stage.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-warm-gray">
                      <span>
                        {completedSteps}/{totalSteps} steps
                      </span>
                    </div>

                    {totalSteps > 0 && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream">
                        <div
                          className="h-full rounded-full bg-sage transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}
                  </button>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingStageId(stage.id)}
                      className="p-2 text-warm-gray hover:text-charcoal hover:bg-cream rounded-lg transition-colors"
                      aria-label="Edit stage"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingStageId(stage.id)}
                      className="p-2 text-warm-gray hover:text-terracotta hover:bg-terracotta/10 rounded-lg transition-colors"
                      aria-label="Delete stage"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleStage(stage.id)}
                      className="p-2 text-warm-gray hover:text-charcoal"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <FiChevronDown className="h-5 w-5" />
                      ) : (
                        <FiChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border-warm px-5 pb-5 pt-3">
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
                            <p className="text-sm text-charcoal">
                              {stage.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {stage.steps.map((step, sIdx) => (
                        <StepCard
                          key={step.id}
                          step={step}
                          index={sIdx}
                          total={stage.steps.length}
                          isNext={step.id === nextStepId}
                          projectId={projectId}
                          stageTitle={stage.title}
                          onToggle={handleStepToggle}
                          onEdit={handleUpdateStep}
                          onDelete={handleDeleteStep}
                          onMove={handleMoveStep}
                          onUpdateSubTasks={handleUpdateSubTasks}
                        />
                      ))}
                      <AddStepButton
                        onCreate={(data) => handleCreateStep(stage.id, data)}
                        projectId={projectId}
                        stageTitle={stage.title}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Add stage button */}
      <AddStageButton onCreate={handleCreateStage} />

      {/* Delete confirmation */}
      <ConfirmDelete
        open={deletingStageId !== null}
        title="Delete this stage?"
        message="This will remove the stage and all its steps. This can't be undone."
        onConfirm={() =>
          deletingStageId && handleDeleteStage(deletingStageId)
        }
        onCancel={() => setDeletingStageId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
