import { createClient } from "@/lib/supabase/server";
import {
  Hammer,
  Stack,
  SealCheck,
  MegaphoneSimple,
  HardHat,
} from "@phosphor-icons/react/dist/ssr";
import { MarketingTopNav } from "@/components/marketing/MarketingTopNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { RoleCard } from "@/components/marketing/RoleCard";

export const metadata = {
  title: "Who it's for — Bench",
  description:
    "Bench is for people who build the thing themselves — and for a small circle who shape the tools, the templates, and the knowledge.",
};

export default async function WhoItsForPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <MarketingTopNav isAuthed={!!user} />

      {/* Hero */}
      <section className="bg-grid border-b border-hairline">
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            Who Bench is for
          </p>
          <h1 className="mt-4 font-display-xl text-ink max-w-4xl">
            For people who build the thing themselves.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-graphite max-w-3xl leading-relaxed">
            And for a small circle who shape the tools, the templates, and the
            knowledge that make the building possible. Five roles, one shared
            workshop.
          </p>
        </div>
      </section>

      {/* Tier 1 — DIYer (featured, live) */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <RoleCard
            Icon={Hammer}
            eyebrow="Tier 1 — The core user"
            title="DIYer"
            tagline="You&apos;re the reason Bench exists."
            body="You&apos;re planning a project on your own house or your own bench. Maybe a full bathroom gut. Maybe a Shaker vanity for your guest bath. Maybe a Saturday macramé piece. Bench turns your scope, your skill level, and your jurisdiction into a real staged plan you can actually execute — with permits, lead times, and your own toolbox baked in."
            signals={[
              "Your friend did her bathroom — you want to do yours",
              "You're tired of Pinterest rabbit holes that don't turn into plans",
              "You want to save real money by building it yourself",
              "You need a plan that respects how old your house is, not a generic template",
            ]}
            source="who-its-for-diyer"
            roleInterest="diyer"
            cta="Join the beta"
            featured
          />
        </div>
      </section>

      {/* Tier 2 — Builder */}
      <section className="border-b border-hairline bg-ivory">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <RoleCard
            Icon={Stack}
            eyebrow="Tier 2 — Coming soon"
            title="Builder"
            tagline="You author the templates DIYers clone."
            body="You&apos;ve built enough vanities, tiled enough showers, or dialed in enough paint-the-cabinets recipes that other DIYers want your exact sequence. Builders write reusable components, techniques, kits, and checklists — then earn from every clone. We&apos;re looking for a small first cohort to seed the template library before it opens to the public."
            signals={[
              "You've built the same thing enough times to write the definitive plan",
              "You're a carpenter, tile setter, or specialist craftsperson with a repeatable method",
              "You want to earn from your knowledge without building a course or YouTube channel",
            ]}
            source="who-its-for-builder"
            roleInterest="builder"
            cta="Apply as a Builder"
          />
        </div>
      </section>

      {/* Tier 3 — Expert */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <RoleCard
            Icon={SealCheck}
            eyebrow="Tier 3 — Invite only"
            title="Expert"
            tagline="You gate the quality and shape the knowledge base."
            body="Licensed pros and deep-domain hobbyists who review Builder templates before they go public — approve, request revisions, or reject with feedback. You also contribute to the substitution DB, the permit-nuance library, and the failure-case archive. Bench pays a flat fee per approved review plus a royalty on knowledge contributions."
            signals={[
              "Licensed plumber, electrician, GC, or specialty contractor",
              "A craftsperson with 10+ years and a real track record",
              "You want to shape a tool that makes DIYers less dangerous to their own homes",
            ]}
            source="who-its-for-expert"
            roleInterest="expert"
            cta="Apply as an Expert"
          />
        </div>
      </section>

      {/* Tier 4 — Ambassador */}
      <section className="border-b border-hairline bg-ivory">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <RoleCard
            Icon={MegaphoneSimple}
            eyebrow="Tier 4 — Apply"
            title="Brand Ambassador"
            tagline="You&apos;re building publicly — let&apos;s collab."
            body="You post real projects on YouTube, Instagram, TikTok, or your own blog. You&apos;d use Bench on projects you were going to do anyway, and you want early-access features, a direct line to the product team, and a share of referral revenue. Not aggressive pursuit — just honest alignment with people already doing the work."
            signals={[
              "You publish real DIY / reno / craft projects to an audience",
              "You want early access to features and a direct product-team line",
              "You want to be paid for real referrals, not perform paid posts",
            ]}
            source="who-its-for-ambassador"
            roleInterest="ambassador"
            cta="Apply as Ambassador"
          />
        </div>
      </section>

      {/* Tier 5 — Contractor */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <RoleCard
            Icon={HardHat}
            eyebrow="Tier 5 — Waitlist"
            title="Contractor"
            tagline="Show up where DIYers hire out."
            body="When a DIYer decides a stage is over their head — rough-in plumbing, a panel upgrade, tricky framing — Bench points them at local licensed pros. Contractor profiles include portfolio, trade, service area, and verified license. Featured placement is paid; baseline listing is free while we build the directory."
            signals={[
              "Licensed contractor, electrician, plumber, framer, tile setter, or HVAC pro",
              "You want qualified leads from homeowners already scoped, not cold calls",
              "You serve a specific metro area and know your trade deeply",
            ]}
            source="who-its-for-contractor"
            roleInterest="contractor"
            cta="Join the waitlist"
          />
        </div>
      </section>

      {/* Footer note */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            One more note
          </p>
          <h2 className="mt-3 font-display-lg text-ink">
            A shared workshop, not a marketplace.
          </h2>
          <p className="mt-6 text-lg text-graphite leading-relaxed">
            These roles aren&apos;t ranks. A DIYer today can be a Builder next
            year. A Contractor can be a Brand Ambassador. An Expert can still
            plan their own kitchen remodel. Bench is built to let people switch
            hats without switching accounts.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
