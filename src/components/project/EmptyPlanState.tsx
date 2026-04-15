"use client";

import { useState } from "react";
import { FiZap, FiEdit3 } from "react-icons/fi";
import DraftPlanModal from "./DraftPlanModal";

interface EmptyPlanStateProps {
  projectId: string;
  onStartBlank: () => void | Promise<void>;
}

export default function EmptyPlanState({
  projectId,
  onStartBlank,
}: EmptyPlanStateProps) {
  const [showDraftModal, setShowDraftModal] = useState(false);
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
    <>
      <div className="rounded-2xl bg-white border border-border-warm p-10 text-center">
        <h2 className="font-serif text-3xl text-charcoal mb-2">
          Your project needs a plan
        </h2>
        <p className="text-warm-gray text-sm mb-8 max-w-md mx-auto">
          Start by setting up a tentative plan with a few questions, or jump
          straight in and build it stage by stage yourself.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <button
            onClick={() => setShowDraftModal(true)}
            className="flex flex-col items-center gap-2 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white p-6 transition-colors"
          >
            <FiZap className="h-6 w-6" />
            <span className="font-semibold">Set up my plan</span>
            <span className="text-xs opacity-90">
              Answer 5 questions. Get a tentative plan to edit.
            </span>
          </button>

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

      {showDraftModal && (
        <DraftPlanModal
          projectId={projectId}
          onClose={() => setShowDraftModal(false)}
        />
      )}
    </>
  );
}
