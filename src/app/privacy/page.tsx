import { createClient } from "@/lib/supabase/server";
import { MarketingTopNav } from "@/components/marketing/MarketingTopNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export const metadata = {
  title: "Privacy — Bench",
  description: "How Bench handles your data. Plain-English version.",
};

export default async function PrivacyPage() {
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
              Privacy Policy
            </p>
            <h1 className="font-display-xl text-ink">How we handle your data.</h1>
            <p className="text-sm text-graphite">
              Last updated: April 18, 2026. This is the beta version —
              it&apos;ll be expanded before public launch.
            </p>
          </header>

          <Section title="What we collect">
            <p>
              <strong>Account info.</strong> Email address, optional display
              name, and (if you add it) a default location for permits.
              Nothing else required.
            </p>
            <p>
              <strong>Project content.</strong> Whatever you put into Bench —
              project names, plans, stages, shopping lists, photos, notes.
              This is yours; we don&apos;t use it to train models.
            </p>
            <p>
              <strong>Usage.</strong> Basic page visits, feature usage, and
              errors, so we can fix what&apos;s broken. We do not track you
              across other sites.
            </p>
          </Section>

          <Section title="What we don't do">
            <ul className="list-disc list-inside space-y-2">
              <li>Sell your data. Ever. Full stop.</li>
              <li>Share your projects with other users unless you choose to.</li>
              <li>Use your private projects to train AI models.</li>
              <li>Add advertising trackers.</li>
            </ul>
          </Section>

          <Section title="How we use AI">
            <p>
              When you use Bench&apos;s intake, plan drafting, or revision
              features, we send the relevant project context (intake answers,
              the current plan) to Anthropic&apos;s API to generate a
              response. Anthropic does not use this content to train models
              under our API agreement.
            </p>
            <p>
              AI calls happen on-demand only. We don&apos;t continuously feed
              your data to AI in the background.
            </p>
          </Section>

          <Section title="Infrastructure">
            <p>
              Bench runs on Supabase (Postgres + auth + storage) and Vercel
              (app hosting). Both are US-based. Row-level security isolates
              your data to your account.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              Delete your account and all associated data at any time from
              your Account page. We&apos;ll confirm deletion by email. We
              respect GDPR and CCPA data-subject rights globally, not just
              where required.
            </p>
          </Section>

          <Section title="Questions">
            <p>
              Email{" "}
              <a
                href="mailto:privacy@benchapp.co"
                className="text-walnut hover:underline"
              >
                privacy@benchapp.co
              </a>{" "}
              and a human (probably Codi) will reply.
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
