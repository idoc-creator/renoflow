import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/browse/TopNav";
import BuildThisButton from "@/components/project/BuildThisButton";

const difficultyStyles: Record<string, string> = {
  beginner: "bg-sage/10 text-sage",
  intermediate: "bg-amber-100 text-amber-800",
  advanced: "bg-terracotta/10 text-terracotta",
};

interface Step {
  title: string;
  description: string;
  materials_needed?: Array<{ name: string; quantity: number; unit: string }>;
}

interface Stage {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
  steps: Step[];
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: template } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!template) notFound();

  const planData = template.plan_data as { stages: Stage[] };
  const stages = planData?.stages ?? [];

  // Collect first few materials
  const firstMaterials: string[] = [];
  for (const stage of stages) {
    for (const step of stage.steps ?? []) {
      for (const mat of step.materials_needed ?? []) {
        if (mat.name && firstMaterials.length < 6) {
          firstMaterials.push(mat.name);
        }
      }
    }
    if (firstMaterials.length >= 6) break;
  }

  return (
    <div className="min-h-screen">
      <TopNav isAuthed={!!user} />
      {template.cover_image_url && (
        <div className="w-full max-h-[500px] overflow-hidden bg-warm-gray/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={template.cover_image_url}
            alt={template.title}
            className="w-full h-full object-cover max-h-[500px]"
          />
        </div>
      )}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-serif text-4xl text-charcoal mb-3">
          {template.title}
        </h1>
        <p className="text-warm-gray text-lg mb-6">{template.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-sm mb-6">
          <span className="text-charcoal font-semibold">
            {template.build_count} built
          </span>
          {template.avg_rating && (
            <span className="text-warm-gray">· ★ {template.avg_rating}</span>
          )}
          {template.estimated_cost && (
            <span className="text-warm-gray">
              · ~${Math.round(template.estimated_cost)}
            </span>
          )}
          {template.estimated_hours && (
            <span className="text-warm-gray">
              · {template.estimated_hours}h
            </span>
          )}
          {template.difficulty_level && (
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                difficultyStyles[template.difficulty_level] ?? ""
              }`}
            >
              {template.difficulty_level}
            </span>
          )}
        </div>

        <div className="mb-10">
          <BuildThisButton templateId={template.id} />
        </div>

        {firstMaterials.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl text-charcoal mb-3">
              What you&apos;ll need
            </h2>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {firstMaterials.map((name, i) => (
                <li
                  key={i}
                  className="bg-white rounded-lg px-3 py-2 text-sm text-charcoal border border-border-warm"
                >
                  {name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {stages.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl text-charcoal mb-3">
              The stages
            </h2>
            <div className="space-y-4">
              {stages.map((stage, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-border-warm"
                >
                  <h3 className="font-serif text-xl text-charcoal mb-1">
                    {i + 1}. {stage.title}
                  </h3>
                  <p className="text-warm-gray text-sm mb-2">
                    {stage.description}
                  </p>
                  <div className="text-xs text-warm-gray">
                    ~${Math.round(stage.estimated_cost)} ·{" "}
                    {stage.estimated_hours}h
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10 bg-white rounded-xl p-6 border border-border-warm text-center">
          <p className="font-serif text-xl text-charcoal">Builder gallery</p>
          <p className="text-warm-gray text-sm mt-1">
            Coming soon — photos from makers who built this.
          </p>
        </section>

        <section className="mb-10 bg-white rounded-xl p-6 border border-border-warm text-center">
          <p className="font-serif text-xl text-charcoal">Reviews</p>
          <p className="text-warm-gray text-sm mt-1">Coming soon.</p>
        </section>
      </main>
    </div>
  );
}
