import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProjectsShell } from "./projects-shell";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Gate projects access on completing the one-time /welcome flow so the
  // first-intake doesn't have to re-ask location / residence / currency.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) {
    redirect("/welcome");
  }

  const displayName =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  return <ProjectsShell displayName={displayName}>{children}</ProjectsShell>;
}
