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
    setList(
      list.map((s) => (s.id === id ? { ...s, accepted: !s.accepted } : s))
    );
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
            <h2 className="font-serif text-2xl text-charcoal">Rough it in</h2>
          </div>
          <p className="text-warm-gray text-sm mb-6">
            Suggestions for:{" "}
            <span className="font-semibold text-charcoal">{stepTitle}</span>
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
