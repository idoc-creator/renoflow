import { createClient } from "@/lib/supabase/server";
import { MarketingTopNav } from "@/components/marketing/MarketingTopNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { BetaSignupForm } from "@/components/marketing/BetaSignupForm";

export const metadata = {
  title: "Join the beta — Bench",
  description: "Leave your email and be first in when Bench opens.",
};

export default async function JoinBetaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <MarketingTopNav isAuthed={!!user} />

      <section className="flex-1 bg-grid">
        <div className="mx-auto max-w-2xl px-6 py-24 md:py-32 text-center">
          <p className="text-caption uppercase tracking-[0.22em] text-walnut">
            Private beta — open soon
          </p>
          <h1 className="mt-4 font-display-xl text-ink">
            First in, first building.
          </h1>
          <p className="mt-6 text-lg text-graphite leading-relaxed">
            We&apos;re opening the beta to a small group of makers and
            homeowners who actually want to use the thing on real projects.
            Drop your email. One note when doors open. No spam, no drip
            campaign, no pitch.
          </p>
          <div className="mt-10 flex justify-center">
            <BetaSignupForm source="join-beta-page" cta="Join the beta" />
          </div>
          <p className="mt-10 text-sm text-graphite">
            Already signed up? You&apos;re good.{" "}
            <a
              href="mailto:hello@benchapp.co"
              className="text-walnut hover:underline"
            >
              Email us
            </a>{" "}
            if you want to jump the line — tell us about your project.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
