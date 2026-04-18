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
import { StampBadge } from "@/components/marketing/StampBadge";

export const metadata = {
  title: "Pricing — Bench",
  description:
    "Free to start, $9 to unlock everything, and a cut when your shares bring people in.",
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
          <p className="font-hand-lg text-walnut">a simple deal —</p>
          <h1 className="mt-3 font-display-xl text-ink">
            Free to start.{" "}
            <span className="underline-hand">$9 when you&apos;re hooked.</span>
          </h1>
          <p className="mt-6 text-lg text-graphite max-w-2xl mx-auto leading-relaxed">
            Our vision: Bench stays free for planning. Limited to no ads,
            ever. DIYers come here to save money — so the people using
            Bench make money too, when they share it.
          </p>
        </div>
      </section>

      {/* Two-tier plan */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-2">
            {/* FREE */}
            <div className="rounded-2xl border border-hairline bg-paper p-8 md:p-10 flex flex-col">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <p className="text-caption uppercase tracking-[0.22em] text-walnut">
                  Bench Free
                </p>
                <p className="font-hand text-xl text-moss-dark">always free</p>
              </div>
              <p className="mt-4 font-display-xl text-ink">
                $0<span className="text-graphite text-2xl">/forever</span>
              </p>
              <p className="mt-3 text-graphite">
                Everything a DIYer needs to plan + execute a project or two.
              </p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {[
                  "Up to 3 active projects",
                  "All AI features — intake, plan drafts, revisions",
                  "Permits + inspection milestones (US)",
                  "Shopping list with lead-time tracking",
                  "Toolbox as source of truth",
                  "Sub-project linking",
                  "Referral program — earn 15% lifetime on what your referrals pay",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={16}
                      weight="bold"
                      className="text-moss-dark shrink-0 mt-1"
                    />
                    <span className="text-sm text-ink leading-relaxed">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-hairline">
                <BetaSignupForm
                  source="pricing-free"
                  cta="Start free"
                  roleInterest="diyer"
                />
              </div>
            </div>

            {/* PRO */}
            <div className="relative rounded-2xl border-2 border-walnut bg-paper p-8 md:p-10 flex flex-col shadow-sm">
              <StampBadge className="absolute -top-4 -right-4 !w-20 !h-20 !text-sm bg-walnut text-white border-walnut">
                worth it
              </StampBadge>
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <p className="text-caption uppercase tracking-[0.22em] text-walnut">
                  Bench Pro
                </p>
                <p className="font-hand text-xl text-walnut">for real builders</p>
              </div>
              <p className="mt-4 font-display-xl text-ink">
                $9<span className="text-graphite text-2xl">/mo</span>
              </p>
              <p className="mt-1 text-sm text-graphite">
                or $90/year — save 17%
              </p>
              <p className="mt-3 text-graphite">
                Unlimited projects, faster AI, bigger referral cut.
              </p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {[
                  "Unlimited active projects",
                  "Priority AI — faster intake + plan drafts",
                  "Advanced analytics (time tracking, budget variance, what-worked)",
                  "Early access to new features",
                  "Higher referral cut — 25% lifetime (vs 15% on Free)",
                  "All Free features, unlocked",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={16}
                      weight="bold"
                      className="text-walnut shrink-0 mt-1"
                    />
                    <span className="text-sm text-ink leading-relaxed">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-hairline">
                <BetaSignupForm
                  source="pricing-pro"
                  cta="Get early Pro access"
                  roleInterest="diyer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* We pay YOU back */}
      <section className="border-t border-hairline bg-ivory">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="flex items-start gap-6 flex-wrap">
            <StampBadge>share → earn</StampBadge>
            <div className="flex-1 min-w-[250px]">
              <p className="text-caption uppercase tracking-[0.22em] text-walnut">
                How we make money — and share it
              </p>
              <h2 className="mt-3 font-display-lg text-ink">
                You share it, we split it.
              </h2>
              <p className="mt-4 text-lg text-graphite leading-relaxed">
                Bench needs revenue to pay the AI bill, pay experts, and pay
                people who bring others in. The pattern is simple: Pro
                subscriptions + template sales + affiliate commissions fund
                the whole thing. And{" "}
                <span className="underline-hand">
                  when someone signs up through your share link
                </span>
                , you earn a cut of whatever they pay Bench — for the life of
                their account.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <RevCard
              Icon={HandCoins}
              headline="Every user is a Brand Ambassador."
              body={
                <>
                  Every signed-up DIYer gets a share link. When someone signs
                  up through it and eventually pays for Pro, buys a template,
                  or clicks an affiliate product link — you get a cut. Free
                  users earn 15% lifetime. Pro users earn 25%.{" "}
                  <strong className="text-ink">
                    20 followers or 2 million — doesn&apos;t matter.
                  </strong>
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
                  majority of every clone. Bench keeps a minority. Planning
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
              headline="Pro subscriptions fund the rest."
              body={
                <>
                  The $9/mo Pro tier is what keeps the lights on — AI usage,
                  infrastructure, expert payouts, your referral checks. It
                  pays the ambassadors too. That&apos;s why the math works.
                </>
              }
            />
          </div>

          <p className="mt-10 text-sm text-graphite italic">
            Referral payout rates, minimums, and vesting land with public
            launch. Pricing changes get 30 days&apos; notice and grandfather
            beta users.
          </p>
        </div>
      </section>

      {/* The anti-promise */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="font-hand-lg text-walnut">a promise —</p>
          <h2 className="mt-2 font-display-lg text-ink">
            Here&apos;s what Bench won&apos;t do.
          </h2>
          <ul className="mt-8 space-y-4 text-ink">
            <li className="flex items-start gap-3">
              <span className="font-hand text-walnut text-xl mt-0.5 leading-none">
                ✓
              </span>
              <span>
                <strong>No paywall on the core planner.</strong> Intake, plan
                drafts, milestones, shopping list, toolbox — always in Free.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-hand text-walnut text-xl mt-0.5 leading-none">
                ✓
              </span>
              <span>
                <strong>Limited to no ads.</strong> No banners, no
                interstitials. If anything sponsored ever appears,
                it&apos;s clearly labeled and relevant (a material brand
                matched to your plan — not noise).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-hand text-walnut text-xl mt-0.5 leading-none">
                ✓
              </span>
              <span>
                <strong>No selling your data.</strong> Ever. Your plans are
                yours.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-hand text-walnut text-xl mt-0.5 leading-none">
                ✓
              </span>
              <span>
                <strong>No training AI on your projects.</strong> Anthropic&apos;s
                API doesn&apos;t train on our traffic by contract.
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
