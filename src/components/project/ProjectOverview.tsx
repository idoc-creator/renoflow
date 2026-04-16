import Link from "next/link";
import { FiClipboard, FiDollarSign, FiImage, FiCamera } from "react-icons/fi";

interface ProjectOverviewProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    cover_image_url: string | null;
    budget_total: number | null;
    budget_spent: number | null;
    contractor_estimate: number | null;
    diy_estimate: number | null;
    status: string;
  };
  stageCount: number;
  stepCount: number;
  completedStepCount: number;
}

export default function ProjectOverview({
  project,
  stageCount,
  stepCount,
  completedStepCount,
}: ProjectOverviewProps) {
  const savings =
    (project.contractor_estimate ?? 0) - (project.diy_estimate ?? 0);
  const budgetRemaining =
    (project.budget_total ?? 0) - (project.budget_spent ?? 0);
  const progressPct =
    stepCount > 0 ? Math.round((completedStepCount / stepCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero / cover image area */}
      <div className="rounded-2xl bg-white border border-border-warm overflow-hidden">
        {project.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-cream to-border-warm flex items-center justify-center">
            <span className="text-warm-gray text-sm">
              Add a cover photo on the Photos tab
            </span>
          </div>
        )}
        <div className="p-6">
          {project.category && (
            <span className="inline-block rounded-full bg-sage/10 text-sage-dark px-3 py-1 text-xs font-medium capitalize mb-2">
              {project.category.replace("_", " ")}
            </span>
          )}
          {project.description ? (
            <p className="text-charcoal leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-warm-gray italic">
              No description yet. Add one in project settings.
            </p>
          )}
        </div>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Stages"
          value={String(stageCount)}
          sublabel={`${stepCount} steps`}
        />
        <StatCard
          label="Progress"
          value={`${progressPct}%`}
          sublabel={`${completedStepCount}/${stepCount} done`}
        />
        <StatCard
          label="Budget left"
          value={`$${budgetRemaining.toLocaleString()}`}
          sublabel={`of $${(project.budget_total ?? 0).toLocaleString()}`}
        />
        <StatCard
          label="Potential savings"
          value={`$${savings.toLocaleString()}`}
          sublabel="vs contractor"
          accent
        />
      </div>

      {/* Quick links to other tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TabLink
          href={`/bunker/project/${project.id}/plan`}
          label="Plan"
          icon={<FiClipboard className="h-5 w-5" />}
        />
        <TabLink
          href={`/bunker/project/${project.id}/mood-board`}
          label="Mood Board"
          icon={<FiImage className="h-5 w-5" />}
        />
        <TabLink
          href={`/bunker/project/${project.id}/budget`}
          label="Budget"
          icon={<FiDollarSign className="h-5 w-5" />}
        />
        <TabLink
          href={`/bunker/project/${project.id}/photos`}
          label="Photos"
          icon={<FiCamera className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        accent
          ? "bg-sage/10 border-sage/30"
          : "bg-white border-border-warm"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-gray">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent ? "text-sage-dark" : "text-charcoal"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-warm-gray mt-0.5">{sublabel}</p>
    </div>
  );
}

function TabLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl bg-white border border-border-warm px-4 py-3 text-sm font-medium text-charcoal hover:border-terracotta transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
