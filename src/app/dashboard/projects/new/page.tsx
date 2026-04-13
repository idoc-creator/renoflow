"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
} from "react-icons/fi";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WizardData {
  projectType: string;
  vision: string;
  budget: string;
  timeline: string;
  skillLevel: string;
  constraints: string[];
  otherConstraints: string;
  zipCode: string;
}

interface StepInfo {
  title: string;
  description: string;
  estimated_cost: number;
  estimated_minutes: number;
  skill_level: string;
  tools_needed: string[];
}

interface Stage {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
  steps: StepInfo[];
}

interface AIPlan {
  stages: Stage[];
  contractor_estimate: number;
  diy_total_estimate: number;
  summary: string;
}

const TOTAL_STEPS = 7;

/* ------------------------------------------------------------------ */
/*  Step components                                                    */
/* ------------------------------------------------------------------ */

const PROJECT_TYPES = [
  { value: "bathroom", label: "Bathroom", emoji: "\u{1F6C1}" },
  { value: "kitchen", label: "Kitchen", emoji: "\u{1F373}" },
  { value: "bedroom", label: "Bedroom", emoji: "\u{1F6CF}" },
  { value: "living_room", label: "Living Room", emoji: "\u{1F6CB}" },
  { value: "basement", label: "Basement", emoji: "\u{1F3DA}" },
  { value: "garage", label: "Garage", emoji: "\u{1F697}" },
  { value: "outdoor_deck", label: "Outdoor / Deck", emoji: "\u{1F333}" },
  { value: "whole_house", label: "Whole House", emoji: "\u{1F3E0}" },
  { value: "other", label: "Other", emoji: "\u{2728}" },
];

const BUDGET_OPTIONS = [
  "Under $1,000",
  "$1,000 - $3,000",
  "$3,000 - $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "$25,000+",
];

const TIMELINE_OPTIONS = [
  { value: "1-2 weekends", label: "1-2 Weekends" },
  { value: "1 month", label: "1 Month" },
  { value: "2-3 months", label: "2-3 Months" },
  { value: "6+ months", label: "6+ Months" },
  { value: "no rush", label: "No Rush" },
];

const SKILL_OPTIONS = [
  {
    value: "first_timer",
    label: "First Timer",
    desc: "Never done DIY before",
  },
  {
    value: "some_experience",
    label: "Some Experience",
    desc: "Painted, basic repairs",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    desc: "Tiling, basic plumbing",
  },
  {
    value: "experienced",
    label: "Experienced",
    desc: "Major renovations before",
  },
];

const CONSTRAINT_OPTIONS = [
  "This is my only bathroom/kitchen (must stay livable)",
  "I'm living in the house during renovation",
  "I want to do this in stages (spread out cost/time)",
  "I have limited tool access",
  "I need to keep noise to a minimum (apartment/condo)",
];

/* ------------------------------------------------------------------ */
/*  Progress bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < current
              ? "w-8 bg-teal-600"
              : i === current
                ? "w-8 bg-teal-400"
                : "w-2 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Selectable card                                                    */
/* ------------------------------------------------------------------ */

function SelectCard({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-teal-600 bg-teal-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main wizard                                                        */
/* ------------------------------------------------------------------ */

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    projectType: "",
    vision: "",
    budget: "",
    timeline: "",
    skillLevel: "",
    constraints: [],
    otherConstraints: "",
    zipCode: "",
  });

  // AI generation state
  const [phase, setPhase] = useState<
    "wizard" | "generating" | "plan"
  >("wizard");
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<AIPlan | null>(null);
  const [genError, setGenError] = useState("");
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const update = useCallback(
    (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch })),
    []
  );

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return !!data.projectType;
      case 1:
        return data.vision.trim().length >= 10;
      case 2:
        return !!data.budget;
      case 3:
        return !!data.timeline;
      case 4:
        return !!data.skillLevel;
      default:
        return true; // steps 5, 6 are optional
    }
  };

  /* ---------- AI generation ---------- */

  const generatePlan = async () => {
    setPhase("generating");
    setGenError("");

    try {
      const res = await fetch("/api/ai/scope-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      // The stream sends JSON at the end
      const parsed: AIPlan = JSON.parse(accumulated);
      setPlan(parsed);
      setPhase("plan");
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Failed to generate plan"
      );
      setPhase("wizard");
    }
  };

  /* ---------- Save to Supabase ---------- */

  const saveProject = async () => {
    if (!plan) return;
    setSaving(true);
    setGenError("");

    try {
      const res = await fetch("/api/projects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wizardData: data, plan }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed: ${res.status}`);
      }

      const { projectId } = await res.json();
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Failed to save project"
      );
      setSaving(false);
    }
  };

  /* ---------- Loading screen ---------- */

  if (phase === "generating") {
    return <GeneratingScreen />;
  }

  /* ---------- Plan review screen ---------- */

  if (phase === "plan" && plan) {
    const savings = plan.contractor_estimate - plan.diy_total_estimate;
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">
          Your Renovation Plan
        </h1>

        {/* Summary */}
        <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-slate-700 leading-relaxed">{plan.summary}</p>
        </div>

        {/* Savings highlight */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <FiDollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-800">
              Estimated savings: ${savings.toLocaleString()} by DIYing this
              yourself
            </p>
            <p className="text-sm text-amber-600">
              Contractor estimate: ${plan.contractor_estimate.toLocaleString()}{" "}
              | Your DIY cost: ${plan.diy_total_estimate.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Stages */}
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Staged Plan ({plan.stages.length} stages)
          </h2>
          {plan.stages.map((stage, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-white shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedStage(expandedStage === idx ? null : idx)
                }
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      {idx + 1}
                    </span>
                    <h3 className="font-semibold text-slate-900">
                      {stage.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {stage.description}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-slate-400">
                    <span>${stage.estimated_cost.toLocaleString()}</span>
                    <span>{stage.estimated_hours}h estimated</span>
                  </div>
                </div>
                {expandedStage === idx ? (
                  <FiChevronUp className="ml-2 h-5 w-5 text-slate-400" />
                ) : (
                  <FiChevronDown className="ml-2 h-5 w-5 text-slate-400" />
                )}
              </button>

              {expandedStage === idx && (
                <div className="border-t border-slate-100 px-5 pb-5">
                  {/* Reason */}
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Why this order
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {stage.reason}
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="mt-4 space-y-3">
                    {stage.steps.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex gap-3 rounded-lg border border-slate-100 p-3"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                          {sIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-800">
                            {s.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {s.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                s.skill_level === "beginner"
                                  ? "bg-green-50 text-green-700"
                                  : s.skill_level === "intermediate"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
                              {s.skill_level}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ~{s.estimated_minutes} min
                            </span>
                          </div>
                          {s.tools_needed.length > 0 && (
                            <p className="mt-1 text-[10px] text-slate-400">
                              Tools: {s.tools_needed.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between pb-8">
          <button
            type="button"
            onClick={() => {
              setPlan(null);
              setPhase("wizard");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiRefreshCw className="h-4 w-4" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={saveProject}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            <FiCheck className="h-4 w-4" />
            {saving ? "Saving..." : "Looks Good -- Save Project"}
          </button>
        </div>

        {genError && (
          <p className="mt-2 text-sm text-red-600 text-center">{genError}</p>
        )}
      </div>
    );
  }

  /* ---------- Wizard steps ---------- */

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          New Renovation Project
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
        <div className="mt-3">
          <ProgressDots current={step} total={TOTAL_STEPS} />
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {step === 0 && (
          <StepProjectType
            value={data.projectType}
            onChange={(v) => update({ projectType: v })}
          />
        )}
        {step === 1 && (
          <StepVision
            value={data.vision}
            onChange={(v) => update({ vision: v })}
          />
        )}
        {step === 2 && (
          <StepBudget
            value={data.budget}
            onChange={(v) => update({ budget: v })}
          />
        )}
        {step === 3 && (
          <StepTimeline
            value={data.timeline}
            onChange={(v) => update({ timeline: v })}
          />
        )}
        {step === 4 && (
          <StepSkillLevel
            value={data.skillLevel}
            onChange={(v) => update({ skillLevel: v })}
          />
        )}
        {step === 5 && (
          <StepConstraints
            constraints={data.constraints}
            otherConstraints={data.otherConstraints}
            onChangeConstraints={(v) => update({ constraints: v })}
            onChangeOther={(v) => update({ otherConstraints: v })}
          />
        )}
        {step === 6 && (
          <StepLocation
            value={data.zipCode}
            onChange={(v) => update({ zipCode: v })}
          />
        )}
      </div>

      {/* Summary (shown on last step) */}
      {step === TOTAL_STEPS - 1 && (
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">Project Summary</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <SummaryRow
              label="Type"
              value={
                PROJECT_TYPES.find((t) => t.value === data.projectType)
                  ?.label || data.projectType
              }
            />
            <SummaryRow
              label="Vision"
              value={
                data.vision.length > 80
                  ? data.vision.slice(0, 80) + "..."
                  : data.vision
              }
            />
            <SummaryRow label="Budget" value={data.budget} />
            <SummaryRow label="Timeline" value={data.timeline} />
            <SummaryRow
              label="Skill Level"
              value={
                SKILL_OPTIONS.find((s) => s.value === data.skillLevel)?.label ||
                data.skillLevel
              }
            />
            {data.constraints.length > 0 && (
              <SummaryRow
                label="Constraints"
                value={data.constraints.length + " selected"}
              />
            )}
            {data.zipCode && (
              <SummaryRow label="ZIP Code" value={data.zipCode} />
            )}
          </dl>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <FiArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={generatePlan}
            disabled={!canAdvance()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-40"
          >
            Generate My Plan
            <FiArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {genError && (
        <p className="mt-4 text-sm text-red-600 text-center">{genError}</p>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Individual step components                                         */
/* ================================================================== */

function StepProjectType({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        What are you renovating?
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Pick the area of your home you want to transform.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PROJECT_TYPES.map((t) => (
          <SelectCard
            key={t.value}
            selected={value === t.value}
            onClick={() => onChange(t.value)}
          >
            <span className="text-2xl">{t.emoji}</span>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {t.label}
            </p>
          </SelectCard>
        ))}
      </div>
    </div>
  );
}

function StepVision({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Describe your renovation
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        The more detail, the better your plan will be.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="I want to remodel my master bathroom. I'm thinking modern farmhouse style with subway tile, a walk-in shower, and new vanity..."
        className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
      <p className="mt-1 text-xs text-slate-400">
        {value.length < 10
          ? `${10 - value.length} more characters needed`
          : "Looking good!"}
      </p>
    </div>
  );
}

function StepBudget({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        What&apos;s your budget range?
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        This helps us tailor material choices and staging.
      </p>
      <div className="mt-4 grid gap-2">
        {BUDGET_OPTIONS.map((b) => (
          <SelectCard key={b} selected={value === b} onClick={() => onChange(b)}>
            <p className="text-sm font-medium text-slate-800">{b}</p>
          </SelectCard>
        ))}
      </div>
    </div>
  );
}

function StepTimeline({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        How much time do you have?
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        We&apos;ll plan stages that fit your schedule.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {TIMELINE_OPTIONS.map((t) => (
          <SelectCard
            key={t.value}
            selected={value === t.value}
            onClick={() => onChange(t.value)}
          >
            <p className="text-sm font-medium text-slate-800">{t.label}</p>
          </SelectCard>
        ))}
      </div>
    </div>
  );
}

function StepSkillLevel({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Your DIY experience
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        This helps us calibrate difficulty and flag steps to hire out.
      </p>
      <div className="mt-4 grid gap-2">
        {SKILL_OPTIONS.map((s) => (
          <SelectCard
            key={s.value}
            selected={value === s.value}
            onClick={() => onChange(s.value)}
          >
            <p className="text-sm font-medium text-slate-800">{s.label}</p>
            <p className="text-xs text-slate-500">{s.desc}</p>
          </SelectCard>
        ))}
      </div>
    </div>
  );
}

function StepConstraints({
  constraints,
  otherConstraints,
  onChangeConstraints,
  onChangeOther,
}: {
  constraints: string[];
  otherConstraints: string;
  onChangeConstraints: (v: string[]) => void;
  onChangeOther: (v: string) => void;
}) {
  const toggle = (c: string) => {
    onChangeConstraints(
      constraints.includes(c)
        ? constraints.filter((x) => x !== c)
        : [...constraints, c]
    );
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Any constraints?
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Check all that apply. This is optional.
      </p>
      <div className="mt-4 space-y-2">
        {CONSTRAINT_OPTIONS.map((c) => (
          <label
            key={c}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={constraints.includes(c)}
              onChange={() => toggle(c)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">{c}</span>
          </label>
        ))}
      </div>
      <textarea
        value={otherConstraints}
        onChange={(e) => onChangeOther(e.target.value)}
        rows={2}
        placeholder="Any other constraints..."
        className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
    </div>
  );
}

function StepLocation({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Where are you located?
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Optional. Helps us give more accurate local pricing.
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
        placeholder="ZIP code (e.g. 90210)"
        maxLength={5}
        className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Generating screen                                                  */
/* ------------------------------------------------------------------ */

function GeneratingScreen() {
  const messages = [
    "Analyzing your project...",
    "Designing your staged plan...",
    "Calculating costs...",
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  // Rotate messages
  useState(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  });

  return (
    <div className="flex flex-col items-center justify-center py-24">
      {/* Spinner */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-teal-600" />
      </div>
      <p className="mt-6 text-lg font-medium text-slate-700">
        {messages[msgIdx]}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        This usually takes 10-20 seconds
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary row                                                        */
/* ------------------------------------------------------------------ */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800 text-right">{value}</dd>
    </div>
  );
}
