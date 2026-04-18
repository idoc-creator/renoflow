import TemplateCard from "./TemplateCard";

interface Template {
  id: string;
  title: string;
  cover_image_url: string | null;
  build_count: number;
  estimated_cost: number | null;
  difficulty_level: string | null;
}

export default function MasonryGrid({
  templates,
}: {
  templates: Template[];
}) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-20 text-warm-gray">
        <p className="font-serif text-2xl">No projects yet.</p>
        <p className="text-sm mt-2">Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
      {templates.map((t) => (
        <TemplateCard
          key={t.id}
          id={t.id}
          title={t.title}
          coverImageUrl={t.cover_image_url}
          buildCount={t.build_count}
          estimatedCost={t.estimated_cost}
          difficultyLevel={t.difficulty_level}
        />
      ))}
    </div>
  );
}
