import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PreferencesForm } from "@/components/bunker/PreferencesForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/bunker/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, email, default_ahj_city, default_ahj_county, default_ahj_state, default_ahj_country, default_currency, is_primary_residence_default"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-caption uppercase tracking-[0.18em] text-walnut">
          Account
        </p>
        <h1 className="font-display-lg text-ink mt-1">
          {profile?.display_name || user.email}
        </h1>
        <p className="text-sm text-graphite mt-1">
          Your profile, defaults, and preferences. We&apos;ll use these so you
          don&apos;t have to re-answer the same questions on every new project.
        </p>
      </div>
      <PreferencesForm
        userEmail={user.email ?? ""}
        initial={{
          display_name: profile?.display_name ?? "",
          email: profile?.email ?? user.email ?? "",
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
