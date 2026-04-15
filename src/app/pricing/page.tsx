import Link from "next/link";
import TopNav from "@/components/browse/TopNav";
import { createClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <TopNav isAuthed={!!user} />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl text-charcoal mb-4">
            Free for every builder. Always.
          </h1>
          <p className="text-warm-gray text-lg max-w-2xl mx-auto">
            Bench is free to use — browse templates, plan projects, build the
            thing, and share your build. Unlimited everything.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-border-warm mb-8">
          <h2 className="font-serif text-3xl text-charcoal mb-4">
            How we make money
          </h2>
          <p className="text-warm-gray mb-4">
            We run on the economy, not on taxing builders. When the community
            thrives, so do we.
          </p>
          <div className="space-y-3 text-charcoal">
            <div className="flex gap-3">
              <span className="text-terracotta font-bold">·</span>
              <div>
                <strong>Template sales (15% cut)</strong>
                <p className="text-sm text-warm-gray">
                  Creators sell polished build plans. Creators keep 85%.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-terracotta font-bold">·</span>
              <div>
                <strong>Affiliate commissions (50/50 split)</strong>
                <p className="text-sm text-warm-gray">
                  Material links earn a small commission. Creators keep half.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-terracotta font-bold">·</span>
              <div>
                <strong>Featured placement</strong>
                <p className="text-sm text-warm-gray">
                  Creators can pay to boost their templates in search.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-border-warm mb-8">
          <h2 className="font-serif text-3xl text-charcoal mb-2">
            Pro Tools <span className="text-terracotta text-base font-normal">(coming soon)</span>
          </h2>
          <p className="text-warm-gray mb-4">
            A future subscription for power creators — advanced analytics,
            priority Ask Bench responses, bulk export, and more. $9/month when
            it ships.
          </p>
          <p className="text-sm text-warm-gray italic">
            Not required for building or selling templates.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-8 py-3 rounded-xl text-lg inline-block"
          >
            Start Building — Free →
          </Link>
        </div>
      </main>
    </div>
  );
}
