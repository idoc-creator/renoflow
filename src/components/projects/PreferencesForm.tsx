"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Preferences {
  display_name: string;
  email: string;
  ahj_city: string;
  ahj_county: string;
  ahj_state: string;
  ahj_country: string;
  currency: string;
  is_primary_residence: boolean | null;
}

export function PreferencesForm({
  initial,
  userEmail,
}: {
  initial: Preferences;
  userEmail: string;
}) {
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
        display_name: prefs.display_name.trim() || null,
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
    "w-full px-4 py-2 bg-paper rounded-lg border border-hairline text-sm text-ink focus:outline-none focus:border-walnut transition-colors";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section label="Profile">
        <Field label="Display name">
          <input
            type="text"
            value={prefs.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            className={input}
            placeholder="What should we call you?"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={userEmail}
            disabled
            className={`${input} cursor-not-allowed opacity-70`}
          />
          <p className="mt-1 text-[11px] text-graphite">
            Email is linked to your sign-in. Contact support to change it.
          </p>
        </Field>
      </Section>

      <Section label="Location defaults">
        <p className="text-xs text-graphite">
          Your default jurisdiction for permits + code. We&apos;ll use this
          automatically on new projects and only ask again if a project is
          somewhere else.
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
          <p className="rounded-lg bg-honey/15 border border-hairline p-2 text-[11px] text-ink">
            Heads up: Bench only has permitting knowledge for the US right now.
            You&apos;ll still get plans; we just won&apos;t auto-seed permit
            milestones.
          </p>
        )}
      </Section>

      <Section label="Currency">
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
      </Section>

      <Section label="Residence status">
        <p className="text-xs text-graphite">
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
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                prefs.is_primary_residence === opt.value
                  ? "bg-walnut text-white border-walnut"
                  : "bg-paper border-hairline text-ink hover:border-walnut"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {error && (
        <div className="rounded-lg bg-oxblood/10 border border-oxblood/30 p-3 text-xs text-oxblood">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-walnut hover:bg-walnut-dark text-white font-semibold text-sm px-5 py-2.5 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {savedAt && !saving && (
          <span className="text-xs text-graphite">Saved.</span>
        )}
      </div>
    </form>
  );
}

/** Section wrapper with an all-caps editorial label */
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-paper border border-hairline p-6 space-y-3">
      <p className="text-caption uppercase tracking-[0.18em] text-walnut">
        {label}
      </p>
      {children}
    </section>
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
      <span className="block text-xs font-semibold text-ink mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
