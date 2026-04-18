import { createClient } from "@/lib/supabase/server";
import { MarketingTopNav } from "@/components/marketing/MarketingTopNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export const metadata = {
  title: "Terms — Bench",
  description: "Terms of service for Bench. Plain-English version.",
};

export default async function TermsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <MarketingTopNav isAuthed={!!user} />

      <section className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 space-y-8">
          <header className="space-y-2">
            <p className="text-caption uppercase tracking-[0.22em] text-walnut">
              Terms of Service
            </p>
            <h1 className="font-display-xl text-ink">The deal in plain English.</h1>
            <p className="text-sm text-graphite">
              Last updated: April 18, 2026. This is the beta version — will be
              expanded before public launch.
            </p>
          </header>

          <Section title="You can use Bench for any legal project">
            <p>
              Build a bathroom, sew a curtain, plan a shed. Bench is a
              planning tool — we provide software, you provide the work and
              the judgment. Don&apos;t use Bench to plan anything illegal,
              harmful to others, or in violation of local codes that actually
              matter.
            </p>
          </Section>

          <Section title="You own your projects">
            <p>
              Everything you create in Bench — plans, notes, photos, lists —
              belongs to you. We hold a minimal license to store and display
              it back to you (obviously). If you delete your account, we
              delete the data.
            </p>
          </Section>

          <Section title="Bench is advisory, not contractor advice">
            <p>
              Plans and permits information in Bench are starting points, not
              legal or professional construction advice. <strong>
                You are responsible for
              </strong>{" "}
              pulling the right permits, following local code, getting
              licensed professionals for work that requires them (gas,
              anything structural past a certain scope, etc.), and your own
              safety.
            </p>
            <p>
              If our suggested milestones don&apos;t match your jurisdiction,
              your jurisdiction wins. Confirm with your AHJ.
            </p>
          </Section>

          <Section title="The AI isn't a contractor">
            <p>
              The AI outputs in Bench are generated suggestions. They can be
              wrong, outdated, or inappropriate for your specific situation.
              Treat them the way you&apos;d treat advice from a knowledgeable
              friend — a starting point, not gospel.
            </p>
          </Section>

          <Section title="Free during beta; pricing may change">
            <p>
              Bench is free while in beta. If we start charging later,
              we&apos;ll give 30 days&apos; notice and honor any pricing
              commitments we make to beta users. You can cancel or delete
              anytime.
            </p>
          </Section>

          <Section title="Account rules">
            <ul className="list-disc list-inside space-y-2">
              <li>One human per account. No bots.</li>
              <li>Don&apos;t upload other people&apos;s copyrighted material.</li>
              <li>Don&apos;t abuse the AI features (we have rate limits).</li>
              <li>Don&apos;t try to break Bench for fun.</li>
            </ul>
          </Section>

          <Section title="We may change these terms">
            <p>
              If we change anything material, we&apos;ll email active users
              before it takes effect. If you don&apos;t like the changes, you
              can delete your account and walk away.
            </p>
          </Section>

          <Section title="Questions">
            <p>
              Email{" "}
              <a
                href="mailto:hello@benchapp.co"
                className="text-walnut hover:underline"
              >
                hello@benchapp.co
              </a>
              .
            </p>
          </Section>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="text-ink leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
