export type Tier = "free" | "plan_it" | "build_it";

const TIER_LIMITS = {
  free: {
    maxProjects: 1,
    maxMoodBoardItems: 20,
    hasCalculators: false,
    hasPermitHelper: false,
  },
  plan_it: {
    maxProjects: Infinity,
    maxMoodBoardItems: Infinity,
    hasCalculators: true,
    hasPermitHelper: false,
  },
  build_it: {
    maxProjects: Infinity,
    maxMoodBoardItems: Infinity,
    hasCalculators: true,
    hasPermitHelper: true,
  },
};

export function getTierLimits(tier: Tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function canCreateProject(
  tier: Tier,
  currentProjectCount: number
): boolean {
  return currentProjectCount < getTierLimits(tier).maxProjects;
}

export function canAddMoodBoardItem(
  tier: Tier,
  currentItemCount: number
): boolean {
  return currentItemCount < getTierLimits(tier).maxMoodBoardItems;
}
