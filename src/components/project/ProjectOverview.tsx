import Link from "next/link";
import {
  FiClipboard,
  FiDollarSign,
  FiImage,
  FiCamera,
  FiTool,
  FiPackage,
  FiShoppingCart,
} from "react-icons/fi";

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
  subProjectCount?: number;
  tools?: { name: string; need_to_buy: boolean }[];
  materials?: string[];
}

export default function ProjectOverview({
  project,
  stageCount,
  stepCount,
  completedStepCount,
  subProjectCount = 0,
  tools = [],
  materials = [],
}: ProjectOverviewProps) {
  const toolsToBuy = tools.filter((t) => t.need_to_buy).length;
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
              No description yet.{" "}
              <Link
                href={`/bunker/project/${project.id}/settings`}
                className="text-terracotta hover:underline not-italic font-medium"
              >
                Add one in settings →
              </Link>
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

      {/* Tools + Materials + Sub-projects aggregation */}
      {(tools.length > 0 || materials.length > 0 || subProjectCount > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Tools */}
          <section className="rounded-2xl bg-white border border-border-warm p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg text-charcoal inline-flex items-center gap-2">
                <FiTool className="h-4 w-4 text-warm-gray" />
                Tools
                <span className="text-xs font-sans font-medium text-warm-gray">
                  {tools.length}
                </span>
              </h3>
              {toolsToBuy > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2 py-0.5 text-[11px] font-medium text-terracotta-dark">
                  <FiShoppingCart className="h-3 w-3" />
                  {toolsToBuy} to buy
                </span>
              )}
            </div>
            {tools.length === 0 ? (
              <p className="text-sm text-warm-gray italic">
                Tools you add to steps will show up here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tools.slice(0, 30).map((t) => (
                  <span
                    key={t.name}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      t.need_to_buy
                        ? "bg-terracotta/10 text-terracotta-dark"
                        : "bg-sage/10 text-sage-dark"
                    }`}
                  >
                    {t.need_to_buy ? "🛒" : "✓"} {t.name}
                  </span>
                ))}
                {tools.length > 30 && (
                  <span className="text-[11px] text-warm-gray">
                    +{tools.length - 30} more
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Materials */}
          <section className="rounded-2xl bg-white border border-border-warm p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg text-charcoal inline-flex items-center gap-2">
                <FiPackage className="h-4 w-4 text-warm-gray" />
                Materials
                <span className="text-xs font-sans font-medium text-warm-gray">
                  {materials.length}
                </span>
              </h3>
              <Link
                href={`/bunker/project/${project.id}/budget`}
                className="text-[11px] font-medium text-terracotta hover:underline"
              >
                Shopping list →
              </Link>
            </div>
            {materials.length === 0 ? (
              <p className="text-sm text-warm-gray italic">
                Materials you add to steps will show up here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {materials.slice(0, 30).map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[11px] font-medium text-charcoal"
                  >
                    {m}
                  </span>
                ))}
                {materials.length > 30 && (
                  <span className="text-[11px] text-warm-gray">
                    +{materials.length - 30} more
                  </span>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {subProjectCount > 0 && (
        <p className="text-xs text-warm-gray">
          This project includes{" "}
          <span className="font-semibold text-charcoal">
            {subProjectCount} sub-project{subProjectCount === 1 ? "" : "s"}
          </span>{" "}
          linked from stages.
        </p>
      )}

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
