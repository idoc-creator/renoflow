import Link from "next/link";
import {
  FiTarget,
  FiClipboard,
  FiTool,
} from "react-icons/fi";

const tiers = [
  {
    name: "Scope It",
    price: "Free",
    description: "Define your renovation scope and get a rough cost estimate.",
    icon: FiTarget,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    name: "Plan It",
    price: "$9/mo",
    description:
      "Full project plan with materials list, timeline, and permit guidance.",
    icon: FiClipboard,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    name: "Build It",
    price: "$19/mo",
    description:
      "Step-by-step build guide, shopping list with price tracking, and earn by sharing.",
    icon: FiTool,
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      {/* Nav */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-teal-700">RenoFlow</span>
          <Link
            href="/auth/login"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center md:py-28">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
          Plan your DIY renovation.{" "}
          <span className="text-teal-600">Save thousands.</span>{" "}
          <span className="text-amber-500">Earn money</span> sharing your
          build.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          RenoFlow walks you through scoping, planning, and building your
          renovation project — with AI-powered estimates, smart shopping lists,
          and a community marketplace for your plans.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-flex items-center rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl"
        >
          Start Planning — Free
        </Link>
      </section>

      {/* Tier cards */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="flex flex-col rounded-xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${tier.bg}`}
              >
                <tier.icon className={`h-6 w-6 ${tier.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {tier.name}
              </h3>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {tier.price}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">
                {tier.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-6 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} RenoFlow. All rights reserved.
      </footer>
    </div>
  );
}
