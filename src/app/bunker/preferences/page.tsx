import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PreferencesForm } from "@/components/bunker/PreferencesForm";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/bunker/preferences");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "default_ahj_city, default_ahj_county, default_ahj_state, default_ahj_country, default_currency, is_primary_residence_default"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-charcoal">Bench preferences</h1>
        <p className="text-sm text-warm-gray mt-1">
          Tell us about your default setup so we stop asking the same questions
          on every new project.
        </p>
      </div>
      <PreferencesForm
        initial={{
          ahj_city: profile?.default_ahj_city ?? "",
          ahj_county: profile?.default_ahj_county ?? "",
          ahj_state: profile?.default_ahj_state ?? "",
          ahj_country: profile?.default_ahj_country ?? "US",
          currency: profile?.default_currency ?? "USD",
          is_primary_residence:
            profile?.is_primary_residence_default ?? null,
        }}
      />
    </div>
  );
}
