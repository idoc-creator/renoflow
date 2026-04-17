import { createClient } from "@/lib/supabase/server";
import {
  ChatCircleText,
  ClipboardText,
  ListChecks,
  Toolbox,
  Compass,
  HandCoins,
} from "@phosphor-icons/react/dist/ssr";
import { MarketingTopNav } from "@/components/marketing/MarketingTopNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { BetaSignupForm } from "@/components/marketing/BetaSignupForm";
import { ProductTour } from "@/components/marketing/ProductTour";

export const metadata = {
  title: "Bench — Stop pinning. Start building.",
  description:
    "The DIY project planner that turns inspiration into a real plan. From bathroom remodels to furniture builds to craft projects. In beta.",
};

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <MarketingTopNav isAuthed={!!user} />

      {/* Hero */}
      <section className="bg-grid">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            Now in private beta
          </p>
          <h1 className="mt-4 font-display-xl text-ink max-w-4xl">
            Stop pinning.{" "}
            <span className="text-walnut">Start building.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-graphite max-w-2xl leading-relaxed">
            Bench turns your inspiration into a real, staged plan you can
            execute — whether it&apos;s a full bathroom gut, a handmade
            vanity, or a Saturday craft. Guided by AI, grounded in real
            contractor know-how.
          </p>
          <div className="mt-8">
            <BetaSignupForm source="landing-hero" />
          </div>
        </div>
      </section>

      {/* A glance at the product */}
      <ProductTour />

      {/* The pillars */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            What Bench does
          </p>
          <h2 className="mt-3 font-display-lg text-ink max-w-3xl">
            Four pillars that turn ideas into projects.
          </h2>
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <Pillar
              Icon={ChatCircleText}
              title="Conversational intake"
              body="Tell Bench about your project like you&apos;d tell a contractor friend. It asks the right questions for your category — bathroom, furniture, craft — and skips what doesn&apos;t apply."
            />
            <Pillar
              Icon={ClipboardText}
              title="A real plan, staged"
              body="Not a to-do list. Stages → steps → sub-tasks, sequenced by dependencies and livability. Review each stage, accept or swap, ask for more detail."
            />
            <Pillar
              Icon={ListChecks}
              title="Permits + inspections"
              body="For US renovations, Bench seeds the right permit + inspection milestones (plumbing rough-in, electrical, final) tied to your jurisdiction. Skip them if you want — we won&apos;t nag."
            />
            <Pillar
              Icon={Toolbox}
              title="Your toolbox is the source"
              body="Tell Bench what tools you own once. Plans flag what you need to buy, what you already have, and which specialty items have 6-week lead times."
            />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-hairline bg-ivory">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            Who it&apos;s for
          </p>
          <h2 className="mt-3 font-display-lg text-ink">
            For the in-between builder.
          </h2>
          <p className="mt-4 text-lg text-graphite max-w-3xl leading-relaxed">
            Too experienced for YouTube-only. Not a contractor. You know the
            project is doable — you just need a real plan, not a Pinterest
            board.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <PersonaCard
              Icon={Compass}
              title="Homeowners, first-time"
              body="Your friend did her bathroom — you can too. Bench translates that confidence into a permit-aware, stage-by-stage plan for your house specifically."
            />
            <PersonaCard
              Icon={HandCoins}
              title="Makers saving money"
              body="Buying a vanity that matches the vision costs $2,400. Building one costs $400 and a weekend. Bench plans the build so you don&apos;t restart three times."
            />
            <PersonaCard
              Icon={ClipboardText}
              title="Crafters scaling up"
              body="You&apos;ve made one. Now you want to make ten. Bench turns your craft into a repeatable project: materials, batch size, tools, timeline."
            />
          </div>
        </div>
      </section>

      {/* Beta note */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            About the beta
          </p>
          <h2 className="mt-3 font-display-lg text-ink">
            Free while we&apos;re building.
          </h2>
          <p className="mt-6 text-lg text-graphite leading-relaxed">
            Bench is in private beta. No pricing, no paywall, no card. We&apos;re
            looking for makers who want to shape the product by actually using
            it on real projects. Leave your email and we&apos;ll send one note
            when the doors open.
          </p>
          <div className="mt-10 flex justify-center">
            <BetaSignupForm source="landing-beta" cta="Join the beta" />
          </div>
          <p className="mt-8 text-sm text-graphite">
            An iPhone app is coming — for now Bench lives on the web, mobile
            friendly.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Pillar({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "duotone" | "bold" | "fill" | "light" | "thin";
    className?: string;
  }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-paper border border-hairline p-6">
      <Icon size={28} weight="duotone" className="text-walnut" />
      <h3 className="mt-4 font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-graphite leading-relaxed">{body}</p>
    </div>
  );
}

function PersonaCard({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "duotone" | "bold" | "fill" | "light" | "thin";
    className?: string;
  }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-paper border border-hairline p-6">
      <Icon size={22} weight="duotone" className="text-walnut" />
      <h3 className="mt-3 font-display text-lg text-ink">{title}</h3>
      <p className="mt-2 text-sm text-graphite leading-relaxed">{body}</p>
    </div>
  );
}
