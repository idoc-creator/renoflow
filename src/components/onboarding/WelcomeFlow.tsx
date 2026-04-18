"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  House,
  Hammer,
  Compass,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { StampBadge } from "@/components/marketing/StampBadge";

interface Draft {
  display_name: string;
  ahj_city: string;
  ahj_county: string;
  ahj_state: string;
  ahj_country: string;
  currency: string;
  is_primary_residence: boolean | null;
}

interface WelcomeFlowProps {
  userId: string;
  userEmail: string;
  initial: Draft;
}

const TOTAL_STEPS = 3;

export function WelcomeFlow({ userId, userEmail, initial }: WelcomeFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  async function persist(andRedirectTo: string) {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        display_name: draft.display_name.trim() || null,
        default_ahj_city: draft.ahj_city.trim() || null,
        default_ahj_county: draft.ahj_county.trim() || null,
        default_ahj_state: draft.ahj_state.trim().toUpperCase() || null,
        default_ahj_country: draft.ahj_country.trim().toUpperCase() || "US",
        default_currency: draft.currency.trim().toUpperCase() || "USD",
        is_primary_residence_default: draft.is_primary_residence,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", userId);
    setSaving(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    router.push(andRedirectTo);
    router.refresh();
  }

  async function handleSkip() {
    // Mark completed anyway so the user isn't re-prompted; they can fill
    // the rest in later from the Account page.
    await persist("/projects");
  }

  return (
    <div className="min-h-screen bg-paper bg-grid flex flex-col">
      {/* Header strip with brand + skip */}
      <header className="border-b border-hairline bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-ink">
            Bench
          </Link>
          <div className="flex items-center gap-4 text-xs text-graphite">
            <span>
              Step {step} of {TOTAL_STEPS}
            </span>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="underline hover:text-ink disabled:opacity-50"
            >
              Skip setup — fill in later
            </button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 w-full bg-hairline">
        <div
          className="h-full bg-walnut transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {step === 1 && (
            <Step1
              value={draft.display_name}
              onChange={(v) => set("display_name", v)}
              onNext={() => setStep(2)}
              email={userEmail}
            />
          )}
          {step === 2 && (
            <Step2
              draft={draft}
              onChange={(k, v) => set(k, v)}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3
              value={draft.is_primary_residence}
              onChange={(v) => set("is_primary_residence", v)}
              onBack={() => setStep(2)}
              onFinish={(dest) => persist(dest)}
              saving={saving}
            />
          )}
          {error && (
            <p className="mt-6 text-center text-sm text-oxblood">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── STEP 1 ─────────────────────────────────────────────────────────────

function Step1({
  value,
  onChange,
  onNext,
  email,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  email: string;
}) {
  return (
    <div className="relative">
      <StampBadge className="absolute -top-4 -right-4 md:-top-6 md:-right-6">
        welcome
        <br />
        friend
      </StampBadge>

      <p className="font-hand-lg text-walnut">hey —</p>
      <h1 className="mt-2 font-display-xl text-ink">
        What should we call you?
      </h1>
      <p className="mt-4 text-lg text-graphite leading-relaxed">
        Bench is a planner for DIYers. Tell it about your project, get a real
        staged plan back. It remembers your tools, your jurisdiction, the
        builds you&apos;ve done — so every next project starts smarter. Takes
        60 seconds to set up.
      </p>

      <div className="mt-10">
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-walnut mb-2">
          Your name
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onNext();
          }}
          placeholder={email ? email.split("@")[0] : "What your friends call you"}
          className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-lg text-ink focus:outline-none focus:border-walnut transition-colors"
          autoFocus
        />
        <p className="mt-2 text-xs text-graphite">
          Shows up in greetings + on your Account page. Change it any time.
        </p>
      </div>

      <div className="mt-10 flex items-center justify-end">
        <button
          onClick={onNext}
          disabled={!value.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-walnut hover:bg-walnut-dark text-white font-semibold px-5 py-2.5 transition-colors disabled:opacity-50"
        >
          Next <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 2 ─────────────────────────────────────────────────────────────

function Step2({
  draft,
  onChange,
  onBack,
  onNext,
}: {
  draft: Draft;
  onChange: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const input =
    "w-full px-4 py-2.5 bg-paper rounded-lg border border-hairline text-ink focus:outline-none focus:border-walnut transition-colors";
  return (
    <div>
      <p className="font-hand-lg text-walnut">a simple one —</p>
      <h1 className="mt-2 font-display-xl text-ink">
        Where do you build?
      </h1>
      <p className="mt-4 text-lg text-graphite leading-relaxed">
        Most of your projects happen where you live. Bench uses this for
        permit rules, local code notes, and material prices — and stops
        re-asking you on every new project.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <Field label="City">
          <input
            type="text"
            value={draft.ahj_city}
            onChange={(e) => onChange("ahj_city", e.target.value)}
            placeholder="Happy Valley"
            className={input}
            autoFocus
          />
        </Field>
        <Field label="County">
          <input
            type="text"
            value={draft.ahj_county}
            onChange={(e) => onChange("ahj_county", e.target.value)}
            placeholder="Clackamas"
            className={input}
          />
        </Field>
        <Field label="State">
          <input
            type="text"
            maxLength={2}
            value={draft.ahj_state}
            onChange={(e) =>
              onChange("ahj_state", e.target.value.toUpperCase())
            }
            placeholder="OR"
            className={input}
          />
        </Field>
        <Field label="Country">
          <select
            value={draft.ahj_country}
            onChange={(e) => onChange("ahj_country", e.target.value)}
            className={input}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="NZ">New Zealand</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Default currency">
          <select
            value={draft.currency}
            onChange={(e) => onChange("currency", e.target.value)}
            className={input}
          >
            <option value="USD">US Dollar (USD)</option>
            <option value="CAD">Canadian Dollar (CAD)</option>
            <option value="GBP">British Pound (GBP)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="AUD">Australian Dollar (AUD)</option>
            <option value="NZD">New Zealand Dollar (NZD)</option>
          </select>
        </Field>
      </div>

      {draft.ahj_country !== "US" && (
        <p className="mt-4 rounded-lg bg-honey/15 border border-hairline p-3 text-xs text-ink">
          <strong>Heads up:</strong> Bench only knows US permit rules today.
          You&apos;ll still get plans — we just won&apos;t auto-seed permit
          milestones outside the US.
        </p>
      )}

      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-graphite hover:text-ink"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-walnut hover:bg-walnut-dark text-white font-semibold px-5 py-2.5 transition-colors"
        >
          Next <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3 ─────────────────────────────────────────────────────────────

function Step3({
  value,
  onChange,
  onBack,
  onFinish,
  saving,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  onBack: () => void;
  onFinish: (dest: string) => void;
  saving: boolean;
}) {
  const options = [
    {
      value: true,
      label: "Primary residence I own",
      desc: "Most US states let homeowners pull their own permits here.",
      Icon: House,
    },
    {
      value: false,
      label: "Rental or not mine",
      desc: "Permits and code still apply; homeowner perks don't.",
      Icon: Hammer,
    },
    {
      value: null,
      label: "Varies by project",
      desc: "Bench will ask per project when it matters.",
      Icon: Compass,
    },
  ];

  return (
    <div>
      <p className="font-hand-lg text-walnut">last one —</p>
      <h1 className="mt-2 font-display-xl text-ink">
        What&apos;s the setup at home?
      </h1>
      <p className="mt-4 text-lg text-graphite leading-relaxed">
        Affects permit guidance. Pick the one that&apos;s true most of the
        time; per-project overrides still work.
      </p>

      <div className="mt-8 space-y-3">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`w-full flex items-start gap-4 rounded-2xl border p-5 text-left transition-all ${
              value === opt.value
                ? "border-walnut bg-walnut/5"
                : "border-hairline bg-paper hover:border-walnut/40"
            }`}
          >
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                value === opt.value
                  ? "bg-walnut text-white"
                  : "bg-ivory text-walnut"
              }`}
            >
              <opt.Icon size={20} weight="duotone" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{opt.label}</p>
              <p className="mt-1 text-sm text-graphite">{opt.desc}</p>
            </div>
            {value === opt.value && (
              <Check
                size={20}
                weight="bold"
                className="text-walnut shrink-0 mt-1"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-graphite hover:text-ink"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onFinish("/projects")}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-paper hover:border-walnut text-ink font-semibold px-4 py-2.5 transition-colors disabled:opacity-50"
          >
            Look around first
          </button>
          <button
            onClick={() => onFinish("/projects/project/new")}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-walnut hover:bg-walnut-dark text-white font-semibold px-5 py-2.5 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : (
              <>
                Start my first project <ArrowRight size={16} weight="bold" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-walnut mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
