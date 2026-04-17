"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BuildThisButton({
  templateId,
}: {
  templateId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/login?redirect=/project/${templateId}`);
      return;
    }

    const res = await fetch(`/api/templates/${templateId}/clone`, {
      method: "POST",
    });

    if (res.ok) {
      const { projectId } = await res.json();
      router.push(`/projects/project/${projectId}`);
    } else {
      setLoading(false);
      alert("Failed to clone template. Try again.");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50 text-lg"
    >
      {loading ? "Building..." : "Build This →"}
    </button>
  );
}
