"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMessageCircle } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  budget_total: number | null;
  contractor_estimate: number | null;
  diy_estimate: number | null;
  contingency_pct: number | null;
}

export function ProjectSettingsForm({ project }: { project: Project }) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [category, setCategory] = useState(project.category ?? "");
  const [status, setStatus] = useState(project.status);
  const [budgetTotal, setBudgetTotal] = useState(
    project.budget_total?.toString() ?? ""
  );
  const [contractorEstimate, setContractorEstimate] = useState(
    project.contractor_estimate?.toString() ?? ""
  );
  const [diyEstimate, setDiyEstimate] = useState(
    project.diy_estimate?.toString() ?? ""
  );
  const [contingencyPct, setContingencyPct] = useState(
    (project.contingency_pct ?? 15).toString()
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        category: category || null,
        status,
        budget_total: budgetTotal ? parseFloat(budgetTotal) : null,
        contractor_estimate: contractorEstimate
          ? parseFloat(contractorEstimate)
          : null,
        diy_estimate: diyEstimate ? parseFloat(diyEstimate) : null,
        contingency_pct: contingencyPct ? parseFloat(contingencyPct) : 15,
      })
      .eq("id", project.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSavedAt(Date.now());
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete "${project.name}"? This removes all stages, steps, and items. Can't be undone.`
      )
    )
      return;
    setDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);
    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }
    router.push("/projects");
  }

  const inputClass =
    "w-full px-4 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl bg-white border border-border-warm p-6 space-y-4">
        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="What are you building, and why?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="renovation">Renovation</option>
              <option value="furniture">Furniture</option>
              <option value="decor">Decor</option>
              <option value="craft">Craft</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In progress</option>
              <option value="on_hold">On hold</option>
              <option value="complete">Complete</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-border-warm p-6 space-y-4">
        <h3 className="font-serif text-lg text-charcoal">Budget</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Total budget ($)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={budgetTotal}
              onChange={(e) => setBudgetTotal(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Contractor estimate ($)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={contractorEstimate}
              onChange={(e) => setContractorEstimate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="DIY estimate ($)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={diyEstimate}
              onChange={(e) => setDiyEstimate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div>
          <Field label="Contingency buffer (%)">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={contingencyPct}
              onChange={(e) => setContingencyPct(e.target.value)}
              className={inputClass}
            />
          </Field>
          <p className="mt-1 text-[11px] text-warm-gray">
            Pros use 15% on most jobs, 25%+ on demo or pre-1980 homes. This pads
            your DIY estimate so surprises don&apos;t feel like failure.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-terracotta-dark">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {savedAt && !saving && (
          <span className="text-xs text-warm-gray">Saved.</span>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-border-warm p-6">
        <h3 className="font-serif text-lg text-charcoal mb-1">Intake</h3>
        <p className="text-sm text-warm-gray mb-3">
          The intake interview shapes every AI suggestion for this project.
          Re-run it any time if your scope changes.
        </p>
        <Link
          href={`/projects/project/${project.id}/intake`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm bg-white px-3 py-1.5 text-sm font-medium text-charcoal hover:border-terracotta"
        >
          <FiMessageCircle className="h-4 w-4" />
          Re-run intake
        </Link>
      </div>

      <div className="rounded-2xl bg-white border border-terracotta/30 p-6">
        <h3 className="font-serif text-lg text-charcoal mb-1">Danger zone</h3>
        <p className="text-sm text-warm-gray mb-4">
          Delete this project permanently. Stages, steps, shopping list, and
          photos go with it.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="border border-terracotta text-terracotta hover:bg-terracotta hover:text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete project"}
        </button>
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
