import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WelcomeFlow } from "@/components/onboarding/WelcomeFlow";

export const metadata = {
  title: "Welcome — Bench",
  description: "A quick setup so your next project starts tailored to you.",
};

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/welcome");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, onboarding_completed_at, default_ahj_city, default_ahj_county, default_ahj_state, default_ahj_country, default_currency, is_primary_residence_default"
    )
    .eq("id", user.id)
    .single();

  // Already onboarded — skip straight to projects.
  if (profile?.onboarding_completed_at) {
    redirect("/projects");
  }

  return (
    <WelcomeFlow
      userId={user.id}
      userEmail={user.email ?? ""}
      initial={{
        display_name: profile?.display_name ?? "",
        ahj_city: profile?.default_ahj_city ?? "",
        ahj_county: profile?.default_ahj_county ?? "",
        ahj_state: profile?.default_ahj_state ?? "",
        ahj_country: profile?.default_ahj_country ?? "US",
        currency: profile?.default_currency ?? "USD",
        is_primary_residence: profile?.is_primary_residence_default ?? null,
      }}
    />
  );
}
