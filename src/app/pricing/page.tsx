"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/stripe";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import type { Tier } from "@/lib/tier";

const FREE_FEATURES = [
  "1 project",
  "20 mood board items",
  "AI project scoping",
  "Basic staged plan",
];

const tiers = [
  {
    key: "free" as const,
    name: "Scope It",
    price: "Free",
    priceNote: "Forever",
    features: FREE_FEATURES,
    cta: "Get Started",
    highlight: false,
  },
  {
    key: "plan_it" as const,
    name: PLANS.plan_it.name,
    price: "$9",
    priceNote: "/month",
    features: PLANS.plan_it.features as unknown as string[],
    cta: "Upgrade to Plan It",
    highlight: true,
  },
  {
    key: "build_it" as const,
    name: PLANS.build_it.name,
    price: "$19",
    priceNote: "/month",
    features: PLANS.build_it.features as unknown as string[],
    cta: "Upgrade to Build It",
    highlight: false,
  },
];

export default function PricingPage() {
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTier() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();
        if (data?.subscription_tier) {
          setCurrentTier(data.subscription_tier as Tier);
        }
      }
    }
    fetchTier();
  }, []);

  async function handleUpgrade(tier: "plan_it" | "build_it") {
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const { url, error } = await res.json();
      if (error) {
        // If not logged in, redirect to login
        if (res.status === 401) {
          window.location.href = "/auth/login";
          return;
        }
        alert(error);
        return;
      }
      if (url) {
        window.location.href = url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Nav */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-teal-700">
            RenoFlow
          </Link>
          <Link
            href={currentTier ? "/dashboard" : "/auth/login"}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            {currentTier ? "Dashboard" : "Sign In"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Simple pricing for every{" "}
          <span className="text-teal-600">DIY renovator</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Start free, upgrade when you need more power.
        </p>
      </section>

      {/* Tier cards */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const isCurrent = currentTier === tier.key;

            return (
              <div
                key={tier.key}
                className={`relative flex flex-col rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md ${
                  tier.highlight
                    ? "ring-2 ring-teal-600"
                    : "border border-slate-200"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <h3 className="text-lg font-semibold text-slate-900">
                  {tier.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">
                    {tier.price}
                  </span>
                  <span className="text-sm text-slate-500">
                    {tier.priceNote}
                  </span>
                </div>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  {isCurrent ? (
                    <div className="flex items-center justify-center rounded-lg border-2 border-teal-600 py-2.5 text-sm font-semibold text-teal-700">
                      Current Plan
                    </div>
                  ) : tier.key === "free" ? (
                    <Link
                      href="/auth/login"
                      className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      Get Started
                      <FiArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={() =>
                        handleUpgrade(tier.key as "plan_it" | "build_it")
                      }
                      disabled={loading === tier.key}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                        tier.highlight
                          ? "bg-teal-600 hover:bg-teal-700"
                          : "bg-slate-800 hover:bg-slate-900"
                      }`}
                    >
                      {loading === tier.key ? "Redirecting..." : tier.cta}
                      {loading !== tier.key && (
                        <FiArrowRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-6 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} RenoFlow. All rights reserved.
      </footer>
    </div>
  );
}
