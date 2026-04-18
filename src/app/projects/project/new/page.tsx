"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreateBlank(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your project a name.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login?redirect=/projects/project/new");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: name.trim(),
        category: category || null,
        budget_total: budget ? parseFloat(budget) : null,
        status: "planning",
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError("Failed to create project. Try again.");
      setLoading(false);
      return;
    }

    router.push(`/projects/project/${data.id}/intake`);
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/projects"
          className="text-warm-gray hover:text-charcoal text-sm"
        >
          ← Back to Projects
        </Link>
        <h1 className="font-serif text-4xl text-charcoal mt-4 mb-2">
          Start a new project
        </h1>
        <p className="text-warm-gray text-lg mb-10">
          Browse a template to start with a complete plan, or start blank and
          build your own.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/"
            className="bg-white rounded-2xl p-6 border border-border-warm hover:border-terracotta transition-colors group"
          >
            <h2 className="font-serif text-2xl text-charcoal mb-2">
              Browse Templates
            </h2>
            <p className="text-warm-gray text-sm mb-4">
              Start with a complete plan from a template. Customize as you go.
            </p>
            <span className="text-terracotta font-semibold group-hover:underline">
              Browse →
            </span>
          </Link>

          <form
            onSubmit={handleCreateBlank}
            className="bg-white rounded-2xl p-6 border border-border-warm"
          >
            <h2 className="font-serif text-2xl text-charcoal mb-2">
              Start Blank
            </h2>
            <p className="text-warm-gray text-sm mb-4">
              Empty project. Add stages and steps yourself.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
              >
                <option value="">Category (optional)</option>
                <option value="renovation">Renovation</option>
                <option value="furniture">Furniture</option>
                <option value="decor">Decor</option>
                <option value="craft">Craft</option>
                <option value="outdoor">Outdoor</option>
              </select>
              <input
                type="number"
                placeholder="Budget (optional)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-2 bg-cream rounded-lg border border-border-warm text-sm focus:outline-none focus:border-terracotta"
              />
              {error && <p className="text-terracotta text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-terracotta hover:bg-terracotta-dark text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Blank Project →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
