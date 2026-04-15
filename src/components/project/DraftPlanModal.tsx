"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";

interface DraftPlanModalProps {
  projectId: string;
  onClose: () => void;
}

const CONSTRAINT_OPTIONS = [
  { key: "only-bathroom", label: "This is my only bathroom" },
  { key: "living-in-house", label: "I'm living in the house during the remodel" },
  { key: "staged-over-time", label: "I need to stage this over weeks/months" },
  { key: "tight-budget", label: "Tight budget" },
  { key: "solo-diy", label: "Solo DIY — no paid help" },
];

const SKILL_LEVELS = [
  { key: "first-timer", label: "First timer — never done DIY" },
  { key: "some", label: "Some experience — painting, basic repairs" },
  { key: "intermediate", label: "Intermediate — tiled, did basic plumbing" },
  { key: "experienced", label: "Experienced — major renos before" },
];

export default function DraftPlanModal({
  projectId,
  onClose,
}: DraftPlanModalProps) {
  const router = useRouter();
  const [scope, setScope] = useState("");
  const [existingVsTarget, setExistingVsTarget] = useState("");
  const [constraints, setConstraints] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("some");
  const [skillsToLearn, setSkillsToLearn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleConstraint(key: string) {
    setConstraints((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scope.trim()) {
      setError("Give us a one-sentence scope to start with.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/draft-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          scope,
          existingVsTarget,
          constraints: constraints.map(
            (k) => CONSTRAINT_OPTIONS.find((c) => c.key === k)?.label ?? k
          ),
          skillLevel:
            SKILL_LEVELS.find((s) => s.key === skillLevel)?.label ?? skillLevel,
          skillsToLearn,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to draft plan. Try again.");
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/30 p-4">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-cream border border-border-warm shadow-xl">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 text-warm-gray hover:text-charcoal"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="p-8">
          <h2 className="font-serif text-3xl text-charcoal mb-2">
            Set up my plan
          </h2>
          <p className="text-warm-gray text-sm mb-6">
            Answer a few questions and Bench will draft a tentative plan you can
            fully edit.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1">
                1. In one sentence, what are you doing?
              </label>
              <textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="e.g., Total gut remodel of my only bathroom"
                rows={2}
                className="w-full px-4 py-2 bg-white rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1">
                2. What&apos;s there now? What do you want instead?
              </label>
              <textarea
                value={existingVsTarget}
                onChange={(e) => setExistingVsTarget(e.target.value)}
                placeholder="e.g., Old single-piece tub/shower combo, pedestal sink, vinyl floor. Want walk-in tile shower, new vanity with storage, tile floor."
                rows={3}
                className="w-full px-4 py-2 bg-white rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">
                3. Constraints (check all that apply)
              </label>
              <div className="space-y-2">
                {CONSTRAINT_OPTIONS.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 text-sm text-charcoal cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={constraints.includes(c.key)}
                      onChange={() => toggleConstraint(c.key)}
                      className="accent-terracotta"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">
                4. Your skill level
              </label>
              <div className="space-y-2">
                {SKILL_LEVELS.map((s) => (
                  <label
                    key={s.key}
                    className="flex items-center gap-2 text-sm text-charcoal cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="skill"
                      value={s.key}
                      checked={skillLevel === s.key}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className="accent-terracotta"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1">
                5. Specific skills you want to tackle yourself?
              </label>
              <p className="text-xs text-warm-gray mb-2">
                e.g., run PEX to the shower, tile the shower walls, build vanity
                from scratch
              </p>
              <textarea
                value={skillsToLearn}
                onChange={(e) => setSkillsToLearn(e.target.value)}
                placeholder="Leave blank if unsure"
                rows={2}
                className="w-full px-4 py-2 bg-white rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
              />
            </div>

            {error && (
              <p className="text-terracotta text-sm bg-terracotta/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? "Drafting your plan..." : "Draft my plan →"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-warm-gray hover:text-charcoal text-sm px-4 py-3"
              >
                Cancel
              </button>
            </div>

            {loading && (
              <p className="text-xs text-warm-gray">
                This takes about 30 seconds. Bench is thinking through your
                constraints and dependencies.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
