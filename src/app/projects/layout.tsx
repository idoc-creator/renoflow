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

  const displayName =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  return <ProjectsShell displayName={displayName}>{children}</ProjectsShell>;
}
