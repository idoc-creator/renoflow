"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCheck,
  FiLoader,
  FiFlag,
  FiFileText,
  FiTruck,
  FiCheckSquare,
  FiEdit3,
  FiRefreshCw,
} from "react-icons/fi";

export interface PreviewStep {
  title: string;
  description: string;
  skill_level: string;
  estimated_minutes: number;
  tools_needed: string[];
}

export interface PreviewStage {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
  steps: PreviewStep[];
}

export interface PreviewMilestone {
  title: string;
  kind: "permit" | "inspection" | "delivery" | "other" | string;
  notes: string;
  blocks_stage_index: number | null;
}

export interface PlanPreview {
  stages: PreviewStage[];
  suggested_milestones: PreviewMilestone[];
}

interface PlanReviewProps {
  projectId: string;
  preview: PlanPreview;
  onCancel: () => void;
  /** Called when a revised plan comes back; parent swaps in the new preview. */
  onReplacePreview: (next: PlanPreview) => void;
}

const KIND_ICON: Record<string, typeof FiFlag> = {
  permit: FiFileText,
  inspection: FiCheckSquare,
  delivery: FiTruck,
  other: FiFlag,
};

const skillColor: Record<string, string> = {
  beginner: "bg-green-50 text-green-700",
  intermediate: "bg-terracotta/10 text-terracotta-dark",
  advanced: "bg-red-50 text-red-700",
  hire_out: "bg-purple-50 text-purple-700",
};

export default function PlanReview({
  projectId,
  preview,
  onCancel,
  onReplacePreview,
}: PlanReviewProps) {
  const router = useRouter();
  const [acceptedStages, setAcceptedStages] = useState<Set<number>>(
    new Set(preview.stages.map((_, i) => i))
  );
  const [acceptedMilestones, setAcceptedMilestones] = useState<Set<number>>(
    new Set((preview.suggested_milestones ?? []).map((_, i) => i))
  );
  // Expand only the first stage by default so review is scannable
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [revising, setRevising] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const toggleStage = (i: number) => {
    setAcceptedStages((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const toggleMilestone = (i: number) => {
    setAcceptedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const toggleExpand = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const expandAll = () =>
    setExpanded(new Set(preview.stages.map((_, i) => i)));
  const collapseAll = () => setExpanded(new Set());

  async function handleRevise() {
    if (!feedback.trim()) return;
    setRevising(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/draft-plan/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          plan: preview,
          feedback: feedback.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Revise failed.");
      }
      const data = await res.json();
      onReplacePreview(data.plan as PlanPreview);
      setFeedback("");
      setFeedbackOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revise failed.");
    } finally {
      setRevising(false);
    }
  }

  async function handleCommit() {
    setCommitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/draft-plan/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          plan: preview,
          accepted_stage_indices: Array.from(acceptedStages),
          accepted_milestone_indices: Array.from(acceptedMilestones),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Couldn't add plan.");
      }
      router.push(`/bunker/project/${projectId}/plan`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add plan.");
      setCommitting(false);
    }
  }

  const totalCost = preview.stages.reduce(
    (sum, s, i) => sum + (acceptedStages.has(i) ? s.estimated_cost : 0),
    0
  );
  const totalHours = preview.stages.reduce(
    (sum, s, i) => sum + (acceptedStages.has(i) ? s.estimated_hours : 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-border-warm p-4">
        <h3 className="font-serif text-lg text-charcoal">
          Your drafted plan — review & accept
        </h3>
        <p className="text-sm text-warm-gray mt-1">
          Here&apos;s every stage with all its steps. Uncheck anything you
          don&apos;t want. Adjustments on the Plan tab afterwards.
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-warm-gray">
          <span>
            <strong className="text-charcoal">
              {acceptedStages.size}/{preview.stages.length}
            </strong>{" "}
            stages accepted
          </span>
          <span>
            est. <strong className="text-charcoal">${totalCost.toLocaleString()}</strong>
          </span>
          <span>
            ~<strong className="text-charcoal">{totalHours}h</strong>
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={expandAll}
              className="text-[11px] text-warm-gray hover:text-charcoal"
            >
              Expand all
            </button>
            <button
              onClick={collapseAll}
              className="text-[11px] text-warm-gray hover:text-charcoal"
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {preview.stages.map((stage, i) => {
          const isAccepted = acceptedStages.has(i);
          const isExpanded = expanded.has(i);
          return (
            <div
              key={i}
              className={`rounded-xl border shadow-sm transition-colors ${
                isAccepted
                  ? "bg-white border-border-warm"
                  : "bg-cream/50 border-border-warm opacity-60"
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Big include checkbox */}
                <button
                  onClick={() => toggleStage(i)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    isAccepted
                      ? "bg-sage border-sage text-white"
                      : "bg-white border-border-warm"
                  }`}
                  aria-label={isAccepted ? "Exclude stage" : "Include stage"}
                >
                  {isAccepted && <FiCheck className="h-3.5 w-3.5" />}
                </button>

                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">
                  {i + 1}
                </span>

                <button
                  onClick={() => toggleExpand(i)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`font-semibold ${
                        isAccepted ? "text-charcoal" : "text-warm-gray line-through"
                      }`}
                    >
                      {stage.title}
                    </h4>
                    <span className="text-[11px] text-warm-gray">
                      {stage.steps.length} step{stage.steps.length === 1 ? "" : "s"}
                    </span>
                    {stage.estimated_cost > 0 && (
                      <span className="text-[11px] text-warm-gray">
                        · ${stage.estimated_cost.toLocaleString()}
                      </span>
                    )}
                    {stage.estimated_hours > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-warm-gray">
                        <FiClock className="h-2.5 w-2.5" />
                        {stage.estimated_hours}h
                      </span>
                    )}
                  </div>
                  {stage.description && (
                    <p className="mt-1 text-sm text-warm-gray line-clamp-2">
                      {stage.description}
                    </p>
                  )}
                </button>

                <button
                  onClick={() => toggleExpand(i)}
                  className="p-1.5 text-warm-gray hover:text-charcoal shrink-0"
                >
                  {isExpanded ? (
                    <FiChevronDown className="h-5 w-5" />
                  ) : (
                    <FiChevronRight className="h-5 w-5" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-border-warm px-4 pb-4 pt-3 space-y-3">
                  {stage.reason && (
                    <div className="rounded-lg bg-sage/5 border border-sage/20 p-3 text-[12px] text-charcoal">
                      <span className="font-semibold">Why: </span>
                      {stage.reason}
                    </div>
                  )}
                  <ol className="space-y-2">
                    {stage.steps.map((step, si) => (
                      <li
                        key={si}
                        className="flex gap-3 rounded-lg border border-border-warm bg-white p-3"
                      >
                        <span className="shrink-0 text-[10px] font-bold text-warm-gray mt-0.5">
                          {si + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-charcoal">
                            {step.title}
                          </p>
                          {step.description && (
                            <p className="mt-0.5 text-xs text-warm-gray">
                              {step.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {step.skill_level && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  skillColor[step.skill_level] ||
                                  "bg-cream text-charcoal"
                                }`}
                              >
                                {step.skill_level.replace("_", " ")}
                              </span>
                            )}
                            {step.estimated_minutes > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-warm-gray">
                                <FiClock className="h-2.5 w-2.5" />~
                                {step.estimated_minutes} min
                              </span>
                            )}
                            {step.tools_needed.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-cream px-2 py-0.5 text-[10px] text-charcoal"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Milestones */}
      {preview.suggested_milestones?.length > 0 && (
        <div className="rounded-xl bg-white border border-border-warm p-4 space-y-3">
          <h4 className="font-serif text-base text-charcoal">
            Suggested milestones
          </h4>
          <p className="text-xs text-warm-gray">
            Permits, inspections, and long-lead deliveries the AI flagged.
            Uncheck any you don&apos;t want.
          </p>
          <ul className="space-y-2">
            {preview.suggested_milestones.map((m, i) => {
              const Icon = KIND_ICON[m.kind] || FiFlag;
              const isAccepted = acceptedMilestones.has(i);
              return (
                <li
                  key={i}
                  className={`flex items-start gap-3 rounded-lg p-3 border ${
                    isAccepted
                      ? "bg-cream/50 border-border-warm"
                      : "bg-cream/20 border-border-warm opacity-60"
                  }`}
                >
                  <button
                    onClick={() => toggleMilestone(i)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                      isAccepted
                        ? "bg-sage border-sage text-white"
                        : "bg-white border-border-warm"
                    }`}
                  >
                    {isAccepted && <FiCheck className="h-3 w-3" />}
                  </button>
                  <Icon className="h-4 w-4 shrink-0 mt-1 text-warm-gray" />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isAccepted
                          ? "text-charcoal"
                          : "text-warm-gray line-through"
                      }`}
                    >
                      {m.title}
                    </p>
                    {m.notes && (
                      <p className="mt-0.5 text-xs text-warm-gray">{m.notes}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Refine / feedback box */}
      <div className="rounded-2xl bg-cream border border-border-warm p-4 space-y-2">
        <button
          onClick={() => setFeedbackOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal"
        >
          <FiEdit3 className="h-4 w-4" />
          Suggest changes or ask for more detail
          {feedbackOpen ? (
            <FiChevronDown className="h-4 w-4" />
          ) : (
            <FiChevronRight className="h-4 w-4" />
          )}
        </button>
        {feedbackOpen && (
          <>
            <p className="text-[11px] text-warm-gray">
              Natural language. Examples: &ldquo;Remove the test &amp; protect
              stage, already did it.&rdquo; · &ldquo;Break tile into two
              stages.&rdquo; · &ldquo;Add a stage for building the
              vanity.&rdquo; · &ldquo;More detail on plumbing rough-in.&rdquo;
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="What would you change?"
              className="w-full rounded-lg border border-border-warm bg-white px-3 py-2 text-sm focus:outline-none focus:border-terracotta"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleRevise}
                disabled={revising || !feedback.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {revising ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Revising…
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="h-4 w-4" />
                    Revise plan
                  </>
                )}
              </button>
              <span className="text-[11px] text-warm-gray">
                Your accept/reject selections reset after a revise.
              </span>
            </div>
          </>
        )}
      </div>

      {/* Footer actions */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="sticky bottom-2 flex items-center gap-2 rounded-2xl bg-white border border-border-warm p-3 shadow-sm">
        <button
          onClick={handleCommit}
          disabled={committing || acceptedStages.size === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-sage hover:bg-sage-dark text-white font-semibold text-sm px-4 py-2 transition-colors disabled:opacity-50"
        >
          {committing ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              Adding…
            </>
          ) : (
            <>
              <FiCheck className="h-4 w-4" />
              Add {acceptedStages.size} stage
              {acceptedStages.size === 1 ? "" : "s"} to my plan
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={committing}
          className="ml-auto inline-flex items-center gap-1 rounded-lg text-xs text-warm-gray hover:text-charcoal px-2 py-1"
          title="Bail back to the intake chat"
        >
          Back to intake
        </button>
      </div>
    </div>
  );
}
