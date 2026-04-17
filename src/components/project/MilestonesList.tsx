"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiFileText,
  FiCheckSquare,
  FiTruck,
  FiFlag,
  FiCheck,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";

export type MilestoneKind = "permit" | "inspection" | "delivery" | "other";
export type MilestoneStatus =
  | "pending"
  | "scheduled"
  | "complete"
  | "failed";

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  kind: MilestoneKind;
  status: MilestoneStatus;
  due_date: string | null;
  notes: string | null;
  blocks_stage_id: string | null;
  sort_order: number;
}

const KIND_META: Record<
  MilestoneKind,
  { label: string; icon: typeof FiFlag; color: string }
> = {
  permit: {
    label: "Permit",
    icon: FiFileText,
    color: "bg-terracotta/10 text-terracotta-dark",
  },
  inspection: {
    label: "Inspection",
    icon: FiCheckSquare,
    color: "bg-sage/10 text-sage-dark",
  },
  delivery: {
    label: "Delivery",
    icon: FiTruck,
    color: "bg-blue-50 text-blue-700",
  },
  other: {
    label: "Milestone",
    icon: FiFlag,
    color: "bg-cream text-warm-gray",
  },
};

const STATUS_META: Record<MilestoneStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-cream text-warm-gray" },
  scheduled: { label: "Scheduled", cls: "bg-blue-50 text-blue-700" },
  complete: { label: "Complete", cls: "bg-green-100 text-green-700" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700" },
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

interface MilestonesListProps {
  projectId: string;
  initial: Milestone[];
  stages: { id: string; title: string }[];
}

export function MilestonesList({
  projectId,
  initial,
  stages,
}: MilestonesListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [milestones, setMilestones] = useState<Milestone[]>(initial);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(data: Omit<Milestone, "id" | "project_id" | "sort_order">) {
    setLoading(true);
    const maxSort = milestones.reduce((m, x) => Math.max(m, x.sort_order), -1);
    const { data: inserted, error } = await supabase
      .from("project_milestones")
      .insert({
        project_id: projectId,
        title: data.title,
        kind: data.kind,
        status: data.status,
        due_date: data.due_date,
        notes: data.notes,
        blocks_stage_id: data.blocks_stage_id,
        sort_order: maxSort + 1,
      })
      .select("*")
      .single();
    setLoading(false);
    if (error || !inserted) {
      alert("Couldn't create milestone.");
      return;
    }
    setMilestones((prev) => [...prev, inserted as Milestone]);
    setAdding(false);
    router.refresh();
  }

  async function handleUpdateStatus(id: string, status: MilestoneStatus) {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
    await supabase
      .from("project_milestones")
      .update({
        status,
        completed_at: status === "complete" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this milestone?")) return;
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("project_milestones").delete().eq("id", id);
    router.refresh();
  }

  if (milestones.length === 0 && !adding) {
    return (
      <div className="rounded-2xl border border-dashed border-border-warm bg-white/60 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif text-base text-charcoal">
              Permits, inspections & deliveries
            </h3>
            <p className="text-xs text-warm-gray mt-0.5">
              Track the things that gate your work — rough-in inspection, tile
              delivery, permit pickup.
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-border-warm px-3 py-1.5 text-xs font-semibold text-charcoal hover:border-terracotta"
          >
            <FiPlus className="h-3.5 w-3.5" />
            Add milestone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-border-warm p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-serif text-lg text-charcoal">
          Permits, inspections & deliveries
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cream px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-border-warm"
          >
            <FiPlus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {milestones.length > 0 && (
        <ul className="space-y-2">
          {milestones.map((m) => {
            const Meta = KIND_META[m.kind];
            const Icon = Meta.icon;
            const days = daysUntil(m.due_date);
            const overdue = days !== null && days < 0 && m.status !== "complete";
            const blockingStage = stages.find(
              (s) => s.id === m.blocks_stage_id
            );
            return (
              <li
                key={m.id}
                className={`flex items-start gap-3 rounded-lg p-3 ${
                  overdue
                    ? "bg-red-50 border border-red-200"
                    : "bg-cream/50 border border-border-warm"
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${Meta.color}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-charcoal truncate">
                      {m.title}
                    </p>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${Meta.color}`}
                    >
                      {Meta.label}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_META[m.status].cls}`}
                    >
                      {STATUS_META[m.status].label}
                    </span>
                    {overdue && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                        <FiAlertTriangle className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-warm-gray flex flex-wrap gap-x-3">
                    {m.due_date && (
                      <span>
                        {formatDate(m.due_date)}
                        {days !== null && !overdue && m.status !== "complete" && (
                          <span className="ml-1 text-warm-gray">
                            ({days === 0 ? "today" : `in ${days}d`})
                          </span>
                        )}
                      </span>
                    )}
                    {blockingStage && (
                      <span>blocks &ldquo;{blockingStage.title}&rdquo;</span>
                    )}
                  </div>
                  {m.notes && (
                    <p className="mt-1 text-xs text-warm-gray whitespace-pre-wrap">
                      {m.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {m.status !== "complete" && (
                    <button
                      onClick={() => handleUpdateStatus(m.id, "complete")}
                      className="p-1.5 text-warm-gray hover:text-sage-dark hover:bg-sage/10 rounded"
                      aria-label="Mark complete"
                      title="Mark complete"
                    >
                      <FiCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-warm-gray hover:text-terracotta hover:bg-terracotta/10 rounded"
                    aria-label="Delete"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <MilestoneForm
          stages={stages}
          onCancel={() => setAdding(false)}
          onSave={handleCreate}
          saving={loading}
        />
      )}
    </div>
  );
}

function MilestoneForm({
  stages,
  onCancel,
  onSave,
  saving,
}: {
  stages: { id: string; title: string }[];
  onCancel: () => void;
  onSave: (data: Omit<Milestone, "id" | "project_id" | "sort_order">) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<MilestoneKind>("inspection");
  const [status, setStatus] = useState<MilestoneStatus>("pending");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [blocksStageId, setBlocksStageId] = useState<string>("");

  const input =
    "w-full px-3 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({
          title: title.trim(),
          kind,
          status,
          due_date: dueDate || null,
          notes: notes.trim() || null,
          blocks_stage_id: blocksStageId || null,
        });
      }}
      className="space-y-2 rounded-lg border border-border-warm bg-white p-3"
    >
      <input
        autoFocus
        type="text"
        placeholder="e.g. Rough plumbing inspection"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={input}
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as MilestoneKind)}
          className={input}
        >
          <option value="permit">Permit</option>
          <option value="inspection">Inspection</option>
          <option value="delivery">Delivery</option>
          <option value="other">Other</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
          className={input}
        >
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
          <option value="complete">Complete</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={input}
        />
        <select
          value={blocksStageId}
          onChange={(e) => setBlocksStageId(e.target.value)}
          className={input}
        >
          <option value="">Blocks stage (optional)</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className={input}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-warm-gray hover:text-charcoal text-sm px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
