"use client";

import { useState } from "react";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { UpgradeModal } from "@/components/UpgradeModal";

interface NewProjectButtonProps {
  projectCount: number;
  tier: string;
}

export function NewProjectButton({ projectCount, tier }: NewProjectButtonProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isFree = tier === "free";
  const atLimit = isFree && projectCount >= 1;

  if (atLimit) {
    return (
      <>
        <button
          onClick={() => setShowUpgrade(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <FiPlus className="h-4 w-4" />
          New Project
        </button>
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          title="Project limit reached"
          message="Free accounts are limited to 1 project. Upgrade to Plan It for unlimited projects."
          suggestedTier="plan_it"
        />
      </>
    );
  }

  return (
    <Link
      href="/dashboard/projects/new"
      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
    >
      <FiPlus className="h-4 w-4" />
      New Project
    </Link>
  );
}
