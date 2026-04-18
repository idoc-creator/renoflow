import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
import type { ToolboxItem } from "@/components/toolbox/types";

export default async function ToolboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let items: ToolboxItem[] = [];
  if (user) {
    const { data } = await supabase
      .from("toolbox_items")
      .select("*")
      .eq("user_id", user.id)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (data) {
      items = data as ToolboxItem[];
    }
  }

  return <ToolboxClient initialItems={items} />;
}
