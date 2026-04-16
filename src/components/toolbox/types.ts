export type ToolCategory =
  | "hand_tool"
  | "power_tool"
  | "ppe"
  | "measuring"
  | "other";

export type ToolStatus =
  | "ready"
  | "needs_repair"
  | "broken"
  | "missing";

export interface Consumable {
  id: string;
  name: string;
  quantity_on_hand: number;
  reorder_date: string | null; // ISO date, e.g. "2026-05-15"
  notes: string | null;
}

export interface ToolboxItem {
  id: string;
  user_id: string;
  name: string;
  category: ToolCategory;
  make: string | null;
  model: string | null;
  status: ToolStatus;
  location: string | null;
  notes: string | null;
  purchase_price: number | null;
  manual_url: string | null;
  consumables: Consumable[];
  catalog_entry_id: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES: Array<{
  value: ToolCategory | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "hand_tool", label: "Hand Tools" },
  { value: "power_tool", label: "Power Tools" },
  { value: "ppe", label: "PPE" },
  { value: "measuring", label: "Measuring" },
  { value: "other", label: "Other" },
];

export const STATUSES: Array<{ value: ToolStatus; label: string }> = [
  { value: "ready", label: "Ready" },
  { value: "needs_repair", label: "Needs repair" },
  { value: "broken", label: "Broken" },
  { value: "missing", label: "Missing" },
];

export const STATUS_COLORS: Record<ToolStatus, string> = {
  ready: "bg-sage/20 text-sage-dark",
  needs_repair: "bg-amber-100 text-amber-800",
  broken: "bg-red-100 text-red-700",
  missing: "bg-warm-gray/20 text-warm-gray",
};

export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function isOverdue(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const now = new Date();
  const date = new Date(isoDate);
  return date < now;
}

export function countOverdueConsumables(consumables: Consumable[]): number {
  return consumables.filter((c) => isOverdue(c.reorder_date)).length;
}
