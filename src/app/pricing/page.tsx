import { createClient } from "@/lib/supabase/server";
import {
  Check,
  HandCoins,
  Storefront,
  SealCheck,
  Rocket,
} from "@phosphor-icons/react/dist/ssr";
import { MarketingTopNav } from "@/components/marketing/MarketingTopNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { BetaSignupForm } from "@/components/marketing/BetaSignupForm";

export const metadata = {
  title: "Pricing — Bench",
  description:
    "Free forever for DIYers. Limited to no ads. When Bench makes money, so do you.",
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
            Free forever for DIYers.
          </h1>
          <p className="mt-6 text-lg text-graphite max-w-2xl mx-auto leading-relaxed">
            We envision Bench free forever, with limited to no ads. DIYers
            are trying to save money — we&apos;re not going to ask you to
            spend more. When Bench makes money, the people using Bench
            make money too.
          </p>
        </div>
      </section>

      {/* Single plan card */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border-2 border-walnut bg-paper p-8 md:p-10 shadow-sm">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <p className="text-caption uppercase tracking-[0.22em] text-walnut">
                Every DIYer
              </p>
              <p className="text-sm font-semibold text-moss-dark">
                Free — and always will be
              </p>
            </div>
            <p className="mt-4 font-display-xl text-ink">
              $0<span className="text-graphite text-2xl">/forever</span>
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Unlimited projects, stages, steps",
                "Unlimited AI intake interviews + plan drafts",
                "Permit + inspection milestones (US)",
                "Shopping list with lead-time tracking",
                "Your toolbox as source of truth",
                "Sub-project linking + parent rollups",
                "Auto-enrolled in the referral program (see below)",
                "Shape the product through direct feedback",
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
              <BetaSignupForm source="pricing-hero" cta="Get beta access" roleInterest="diyer" />
            </div>
          </div>
        </div>
      </section>

      {/* The deal: we pay YOU back */}
      <section className="border-t border-hairline bg-ivory">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            How we make money — and share it
          </p>
          <h2 className="mt-3 font-display-lg text-ink max-w-3xl">
            Bench makes money when you do.
          </h2>
          <p className="mt-4 text-lg text-graphite max-w-2xl leading-relaxed">
            We need revenue to support and build this thing. But you&apos;re
            here to save money, not spend more. So the plan is simple: Bench
            earns from people who find Bench <em>through you</em>, and we
            split it.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <RevCard
              Icon={HandCoins}
              headline="Every user is a Brand Ambassador."
              body={
                <>
                  When you share a completed Bench project on social — a
                  before/after, a finished vanity, a &quot;here&apos;s my
                  whole plan&quot; post — the link is tagged to you. Anyone
                  who signs up through that link earns you a share of their
                  lifetime contribution to Bench.{" "}
                  <strong className="text-ink">
                    20 followers or 2 million — doesn&apos;t matter.
                  </strong>{" "}
                  Real builds, real referrals, real cut.
                </>
              }
              highlight
            />
            <RevCard
              Icon={Storefront}
              headline="Builders earn on templates."
              body={
                <>
                  Template creators (&quot;Builders&quot;) publish reusable
                  component + technique templates — a Shaker vanity, a Kerdi
                  niche, a paint-the-cabinets recipe. Builders keep the
                  majority of every clone. Bench keeps a minority. You
                  don&apos;t need to use paid templates to plan — starting
                  from scratch is always free.
                </>
              }
            />
            <RevCard
              Icon={SealCheck}
              headline="Experts get paid to review."
              body={
                <>
                  Licensed pros and deep-domain hobbyists review Builder
                  templates before they go public. Bench pays a flat fee per
                  approved review + royalties on knowledge-base
                  contributions. This is how Bench stays trustworthy at
                  scale.
                </>
              }
            />
            <RevCard
              Icon={Rocket}
              headline="Pro tools for power users."
              body={
                <>
                  Eventually, power-creator features — bulk export, priority
                  AI, advanced analytics — ship as an optional subscription.
                  Small monthly fee (~$9). Never required for planning,
                  building, or selling templates.
                </>
              }
            />
          </div>

          <p className="mt-10 text-sm text-graphite italic">
            When pricing shifts, we commit to 30 days&apos; notice and
            grandfathering beta users. Referral program details (payout
            rates, minimums, vesting) land with the public launch.
          </p>
        </div>
      </section>

      {/* The anti-pattern pledge */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            What Bench won&apos;t do
          </p>
          <h2 className="mt-3 font-display-lg text-ink">
            The anti-promise.
          </h2>
          <ul className="mt-8 space-y-4 text-ink">
            <li className="flex items-start gap-3">
              <span className="text-walnut mt-1">·</span>
              <span>
                <strong>No paywall on the core planner.</strong> Intake, plan
                drafts, stages, milestones, shopping lists, toolbox — always
                free.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-walnut mt-1">·</span>
              <span>
                <strong>Limited to no ads.</strong> No banner ads, no
                interstitials. If we ever show anything sponsored, it&apos;s
                clearly marked and relevant (a material-brand &quot;this tile
                works for that look&quot; — not cruft).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-walnut mt-1">·</span>
              <span>
                <strong>No selling your data.</strong> Ever. Your plans are
                yours.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-walnut mt-1">·</span>
              <span>
                <strong>No training AI models on your projects.</strong>{" "}
                Anthropic&apos;s API doesn&apos;t train on our traffic by
                contract. Your plans stay your plans.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function RevCard({
  Icon,
  headline,
  body,
  highlight = false,
}: {
  Icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "duotone" | "bold" | "fill" | "light" | "thin";
    className?: string;
  }>;
  headline: string;
  body: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight
          ? "bg-paper border-walnut"
          : "bg-paper border-hairline"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
          highlight ? "bg-walnut text-white" : "bg-ivory text-walnut"
        }`}
      >
        <Icon size={20} weight="duotone" />
      </span>
      <h3 className="mt-4 font-display text-lg text-ink">{headline}</h3>
      <p className="mt-2 text-graphite leading-relaxed">{body}</p>
    </div>
  );
}
