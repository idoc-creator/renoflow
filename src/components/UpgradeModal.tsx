"use client";

import { useState } from "react";
import { FiX, FiCheck, FiArrowRight } from "react-icons/fi";
import { PLANS } from "@/lib/stripe";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  suggestedTier?: "plan_it" | "build_it";
}

export function UpgradeModal({
  open,
  onClose,
  title = "Upgrade to unlock more",
  message = "You've reached the limit on the free plan. Upgrade to keep building.",
  suggestedTier = "plan_it",
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const plan = PLANS[suggestedTier];

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: suggestedTier }),
      });
      const { url, error } = await res.json();
      if (error) {
        alert(error);
        return;
      }
      if (url) {
        window.location.href = url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <FiX className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <h3 className="font-semibold text-teal-800">
            {plan.name} &mdash; $
            {(plan.price / 100).toFixed(0)}/mo
          </h3>
          <ul className="mt-3 space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <span className="text-sm text-teal-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Redirecting..." : "Upgrade Now"}
            {!loading && <FiArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
