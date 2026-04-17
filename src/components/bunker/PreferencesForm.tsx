"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Preferences {
  ahj_city: string;
  ahj_county: string;
  ahj_state: string;
  ahj_country: string;
  currency: string;
  is_primary_residence: boolean | null;
}

export function PreferencesForm({ initial }: { initial: Preferences }) {
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof Preferences>(k: K, v: Preferences[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setSaving(false);
      return;
    }
    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        default_ahj_city: prefs.ahj_city.trim() || null,
        default_ahj_county: prefs.ahj_county.trim() || null,
        default_ahj_state: prefs.ahj_state.trim().toUpperCase() || null,
        default_ahj_country: prefs.ahj_country.trim().toUpperCase() || "US",
        default_currency: prefs.currency.trim().toUpperCase() || "USD",
        is_primary_residence_default: prefs.is_primary_residence,
      })
      .eq("id", user.id);
    setSaving(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setSavedAt(Date.now());
  }

  const input =
    "w-full px-4 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-2xl bg-white border border-border-warm p-6 space-y-4">
        <h2 className="font-serif text-lg text-charcoal">
          Default location (AHJ)
        </h2>
        <p className="text-xs text-warm-gray">
          Your authority-having-jurisdiction — city, county, state, country.
          We&apos;ll use this for permits + code on new projects and only ask
          again if the project is somewhere else.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input
              type="text"
              value={prefs.ahj_city}
              onChange={(e) => update("ahj_city", e.target.value)}
              className={input}
              placeholder="e.g. Happy Valley"
            />
          </Field>
          <Field label="County">
            <input
              type="text"
              value={prefs.ahj_county}
              onChange={(e) => update("ahj_county", e.target.value)}
              className={input}
              placeholder="e.g. Clackamas"
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              maxLength={2}
              value={prefs.ahj_state}
              onChange={(e) => update("ahj_state", e.target.value)}
              className={input}
              placeholder="OR"
            />
          </Field>
          <Field label="Country">
            <select
              value={prefs.ahj_country}
              onChange={(e) => update("ahj_country", e.target.value)}
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
        {prefs.ahj_country !== "US" && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
            Heads up: Bench only has permitting knowledge for the US right now.
            You&apos;ll still get plans, we just won&apos;t auto-seed permit
            milestones.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white border border-border-warm p-6 space-y-4">
        <h2 className="font-serif text-lg text-charcoal">Currency</h2>
        <Field label="Default currency">
          <select
            value={prefs.currency}
            onChange={(e) => update("currency", e.target.value)}
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
      </section>

      <section className="rounded-2xl bg-white border border-border-warm p-6 space-y-4">
        <h2 className="font-serif text-lg text-charcoal">Residence status</h2>
        <p className="text-xs text-warm-gray">
          Most US states let homeowners pull permits on their own primary
          residence. Setting this once saves a question per project.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Primary residence (I own)", value: true },
            { label: "Not my primary residence", value: false },
            { label: "Varies by project", value: null },
          ].map((opt) => (
            <button
              type="button"
              key={String(opt.value)}
              onClick={() => update("is_primary_residence", opt.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                prefs.is_primary_residence === opt.value
                  ? "bg-terracotta text-white border-terracotta"
                  : "bg-white border-border-warm text-charcoal hover:border-terracotta"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-sm px-4 py-2 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {savedAt && !saving && (
          <span className="text-xs text-warm-gray">Saved.</span>
        )}
      </div>
    </form>
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
      <span className="block text-xs font-semibold uppercase tracking-wide text-warm-gray mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
