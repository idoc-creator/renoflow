import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { IntakeChat } from "@/components/project/IntakeChat";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, intake_data, intake_complete")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl text-charcoal">Plan intake</h2>
        <p className="text-sm text-warm-gray mt-1">
          A quick conversation to get your plan tailored. You can bail any time
          and come back — progress saves as we go.
        </p>
      </div>
      <IntakeChat
        projectId={id}
        projectName={project.name}
        initialIntake={
          (project.intake_data as Record<string, unknown> | null) ?? {}
        }
        alreadyComplete={project.intake_complete === true}
      />
    </div>
  );
}
