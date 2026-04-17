import { createClient } from "@/lib/supabase/server";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { MarketingTopNav } from "@/components/marketing/MarketingTopNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { BetaSignupForm } from "@/components/marketing/BetaSignupForm";

export const metadata = {
  title: "Pricing — Bench",
  description: "Free during beta. No paywall. No card.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <MarketingTopNav isAuthed={!!user} />

      {/* Hero */}
      <section className="bg-grid">
        <div className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            Pricing
          </p>
          <h1 className="mt-4 font-display-xl text-ink">
            Free while we&apos;re in beta.
          </h1>
          <p className="mt-6 text-lg text-graphite max-w-2xl mx-auto leading-relaxed">
            No paywall. No card. Unlimited projects, unlimited AI intake,
            unlimited plans. We&apos;ll tell you well before anything
            changes.
          </p>
        </div>
      </section>

      {/* Single plan card */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border-2 border-walnut bg-paper p-8 md:p-10 shadow-sm">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <p className="text-caption uppercase tracking-[0.22em] text-walnut">
                Beta Builder
              </p>
              <p className="text-sm font-semibold text-moss-dark">
                Active now
              </p>
            </div>
            <p className="mt-4 font-display-xl text-ink">
              $0<span className="text-graphite text-2xl">/forever in beta</span>
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Unlimited projects, stages, steps",
                "Unlimited AI intake interviews",
                "AI plan drafting + revisions",
                "Permit + inspection milestones (US)",
                "Shopping list with lead-time tracking",
                "Your toolbox as source of truth",
                "Sub-project linking + parent rollups",
                "Shape the product with direct feedback",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check
                    size={18}
                    weight="bold"
                    className="text-moss-dark shrink-0 mt-0.5"
                  />
                  <span className="text-ink">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <BetaSignupForm source="pricing-hero" cta="Get beta access" />
            </div>
          </div>
        </div>
      </section>

      {/* How we'll make money later */}
      <section className="border-t border-hairline bg-ivory">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            After the beta
          </p>
          <h2 className="mt-3 font-display-lg text-ink">
            When we charge, here&apos;s how.
          </h2>
          <p className="mt-4 text-graphite leading-relaxed">
            We want Bench to stay free for the core act of planning and
            building your own projects. When we eventually charge, the
            revenue comes from optional things — not from locking out the
            basics.
          </p>
          <ul className="mt-8 space-y-4 text-ink">
            <li>
              <strong>Template marketplace (future).</strong> Creators can
              sell polished, reusable project plans. Creators keep the
              majority. Buying is optional; you can always plan from scratch.
            </li>
            <li>
              <strong>Affiliate links on materials (future).</strong> If you
              buy through a shopping-list link, we get a small commission
              from the retailer. You pay nothing extra.
            </li>
            <li>
              <strong>Pro tools (future).</strong> Power-user features like
              bulk export, priority AI, and analytics — for creators running
              Bench as a business. $9-ish/month. Not needed for planning or
              selling.
            </li>
          </ul>
          <p className="mt-8 text-sm text-graphite italic">
            We&apos;ll announce any pricing shift with 30 days&apos; notice
            and grandfather beta users.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
