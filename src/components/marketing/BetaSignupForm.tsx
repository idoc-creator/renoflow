"use client";

import { useState } from "react";
import { CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";

export type RoleInterest =
  | "diyer"
  | "builder"
  | "expert"
  | "ambassador"
  | "contractor";

interface BetaSignupFormProps {
  /** Analytics source — e.g. "landing-hero", "pricing-footer". */
  source: string;
  /** Optional caption above the input. */
  caption?: string;
  /** Optional CTA label override. */
  cta?: string;
  /** Tone: "light" (for dark bg) or "dark" (for light bg). */
  tone?: "light" | "dark";
  /** Persona interest — segments the waitlist by role. */
  roleInterest?: RoleInterest;
}

export function BetaSignupForm({
  source,
  caption,
  cta = "Join the waitlist",
  tone = "dark",
  roleInterest,
}: BetaSignupFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("That email looks off — double-check?");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("beta_signups").insert({
      email: trimmed,
      name: name.trim() || null,
      source,
      role_interest: roleInterest ?? null,
      referrer:
        typeof window !== "undefined" ? document.referrer || null : null,
    });
    setLoading(false);
    if (insertError) {
      // unique violation = already signed up, treat as success (idempotent)
      if (insertError.code === "23505") {
        setDone(true);
        return;
      }
      setError("Couldn't add you — try again in a bit?");
      return;
    }
    setDone(true);
  }

  const isLight = tone === "light";

  if (done) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 ${
          isLight
            ? "bg-white/10 text-white border border-white/20"
            : "bg-moss/10 text-moss-dark border border-moss/30"
        }`}
      >
        <CheckCircle size={20} weight="duotone" />
        <span className="text-sm font-semibold">
          You&apos;re on the list. We&apos;ll ping you when beta opens.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      {caption && (
        <p
          className={`mb-2 text-caption uppercase tracking-[0.18em] ${
            isLight ? "text-white/70" : "text-walnut"
          }`}
        >
          {caption}
        </p>
      )}
      <div
        className={`flex flex-col sm:flex-row items-stretch gap-2 rounded-xl p-1.5 ${
          isLight
            ? "bg-white/10 border border-white/20"
            : "bg-paper border border-hairline"
        }`}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@wherever.com"
          className={`flex-1 bg-transparent px-3 py-2 text-sm outline-none ${
            isLight ? "text-white placeholder:text-white/40" : "text-ink placeholder:text-graphite"
          }`}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-walnut hover:bg-walnut-dark text-white text-sm font-semibold px-4 py-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span>Adding…</span>
          ) : (
            <>
              <PaperPlaneTilt size={16} weight="fill" />
              {cta}
            </>
          )}
        </button>
      </div>
      {/* Optional name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        className={`mt-2 w-full rounded-lg bg-transparent px-3 py-1.5 text-xs outline-none ${
          isLight
            ? "border border-white/15 text-white placeholder:text-white/40"
            : "border border-hairline text-ink placeholder:text-graphite"
        }`}
        disabled={loading}
      />
      {error && (
        <p
          className={`mt-2 text-xs ${
            isLight ? "text-red-200" : "text-oxblood"
          }`}
        >
          {error}
        </p>
      )}
      <p
        className={`mt-2 text-[11px] ${
          isLight ? "text-white/50" : "text-graphite"
        }`}
      >
        No spam — just one email when beta opens.
      </p>
    </form>
  );
}
