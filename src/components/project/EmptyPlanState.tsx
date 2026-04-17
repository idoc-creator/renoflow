"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMessageCircle, FiEdit3 } from "react-icons/fi";

interface EmptyPlanStateProps {
  projectId: string;
  onStartBlank: () => void | Promise<void>;
}

export default function EmptyPlanState({
  projectId,
  onStartBlank,
}: EmptyPlanStateProps) {
  const [startingBlank, setStartingBlank] = useState(false);

  async function handleStartBlank() {
    setStartingBlank(true);
    try {
      await onStartBlank();
    } finally {
      setStartingBlank(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-border-warm p-10 text-center">
      <h2 className="font-serif text-3xl text-charcoal mb-2">
        Your project needs a plan
      </h2>
      <p className="text-warm-gray text-sm mb-8 max-w-md mx-auto">
        I&apos;ll interview you for a few minutes — your house, your scope,
        your skills — and turn it into a tailored plan you can edit. Or jump
        straight in and build stages yourself.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
        <Link
          href={`/projects/project/${projectId}/intake`}
          className="flex flex-col items-center gap-2 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white p-6 transition-colors"
        >
          <FiMessageCircle className="h-6 w-6" />
          <span className="font-semibold">Start intake</span>
          <span className="text-xs opacity-90">
            Quick conversation. Tailored plan at the end.
          </span>
        </Link>

        <button
          onClick={handleStartBlank}
          disabled={startingBlank}
          className="flex flex-col items-center gap-2 rounded-xl bg-white hover:bg-cream border-2 border-border-warm text-charcoal p-6 transition-colors disabled:opacity-50"
        >
          <FiEdit3 className="h-6 w-6" />
          <span className="font-semibold">
            {startingBlank ? "Creating..." : "Start blank"}
          </span>
          <span className="text-xs text-warm-gray">
            Add stages one at a time.
          </span>
        </button>
      </div>
    </div>
  );
}
