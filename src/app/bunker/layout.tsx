import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BunkerShell } from "./bunker-shell";

export default async function DashboardLayout({
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

  return <BunkerShell displayName={displayName}>{children}</BunkerShell>;
}
