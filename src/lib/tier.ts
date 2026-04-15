// Tier system for future Pro features. Builders are always free — unlimited
// projects and unlimited mood board items. The tier system exists for future
// Pro-only features like advanced analytics, priority AI, bulk export.

export type Tier = "free" | "pro";

const TIER_FEATURES = {
  free: {
    hasAdvancedAnalytics: false,
    hasPriorityAI: false,
    hasBulkExport: false,
  },
  pro: {
    hasAdvancedAnalytics: true,
    hasPriorityAI: true,
    hasBulkExport: true,
  },
};

export function getTierFeatures(tier: Tier) {
  return TIER_FEATURES[tier] || TIER_FEATURES.free;
}

// Builders get unlimited everything — Bench makes money from the economy
// (template sales, affiliate commissions), not from limiting builders.
export function canCreateProject(): boolean {
  return true;
}

export function canAddMoodBoardItem(): boolean {
  return true;
}
