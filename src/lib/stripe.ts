import Stripe from "stripe";

// Lazy-init to avoid crashing at build time when env vars are empty
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: "2025-03-31.basil" as any,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead — kept for convenience */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getStripe() as any)[prop];
  },
});

export const PLANS = {
  plan_it: {
    name: "Plan It",
    price: 900, // $9.00 in cents
    features: [
      "Unlimited projects",
      "Unlimited mood board items",
      "AI step-by-step plans",
      "Calculator tools",
      "Budget tracker",
      "Shopping list export",
    ],
  },
  build_it: {
    name: "Build It",
    price: 1900, // $19.00 in cents
    features: [
      "Everything in Plan It",
      "Permit helper",
      "Tool inventory check",
      "AI re-scoping",
      "Progress photo timeline",
      "Priority AI responses",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
