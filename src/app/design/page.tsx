import Link from "next/link";
import {
  FiHome,
  FiLayers,
  FiScissors,
  FiImage,
  FiSun,
  FiCheck,
  FiFlag,
  FiFileText,
  FiTrash2,
} from "react-icons/fi";

/**
 * Live style guide. Every change to design tokens should be visible here
 * immediately — if something on this page looks wrong, something in the
 * system is wrong. See docs/design-system.md for the spec.
 */
export default function DesignPage() {
  return (
    <div className="mx-auto max-w-5xl p-8 space-y-12">
      <header className="space-y-2">
        <p className="text-caption uppercase tracking-[0.15em] text-walnut">
          Bench / Design System
        </p>
        <h1 className="font-display-xl text-ink">Field Notes</h1>
        <p className="max-w-2xl text-graphite">
          Walnut-led warm palette. Pure white paper, deep walnut iconic,
          brass + honey + moss as supporting accents. Editorial serif
          headlines, tighter humanist body. Heavy on images, quiet on
          chrome. If it looks right here, it looks right in the app.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/bunker"
            className="inline-flex items-center gap-1.5 rounded-lg bg-walnut hover:bg-walnut-dark text-white text-sm font-semibold px-4 py-2 transition-colors"
          >
            Back to Bunker
          </Link>
          <a
            href="https://github.com/idoc-creator/renoflow/blob/feat/bench-rebuild/docs/design-system.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-graphite hover:text-ink underline"
          >
            Spec doc →
          </a>
        </div>
      </header>

      {/* Typography */}
      <Section title="Typography">
        <div className="space-y-4 rounded-2xl bg-ivory border border-hairline p-6">
          <p className="font-display-xl">The whole plan for your bathroom.</p>
          <p className="font-display-lg">A clearer way to think about it.</p>
          <p className="font-display">Stage three: tile the surround</p>
          <h1>H1 — page title</h1>
          <h2>H2 — section heading</h2>
          <h3>H3 — card heading</h3>
          <p className="text-base">
            Body copy at the default 500 weight. Reads stronger than the old
            400 and tracks tighter through Inter Tight. Good for long-form
            text inside a project description or a step note.
          </p>
          <p className="text-sm text-graphite">
            Secondary / metadata text. Used for timestamps, captions, hints.
          </p>
          <p className="text-caption uppercase tracking-[0.12em] text-graphite">
            Caption label — uppercase, tight-tracked
          </p>
        </div>
      </Section>

      {/* Neutrals */}
      <Section title="Neutrals">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Swatch name="paper" hex="#ffffff" cls="bg-paper border border-hairline" />
          <Swatch name="ivory" hex="#faf7f0" cls="bg-ivory border border-hairline" />
          <Swatch name="hairline" hex="#e8e0d1" cls="bg-hairline border border-graphite/20" />
          <Swatch name="graphite" hex="#6b5d51" cls="bg-graphite text-white" />
          <Swatch name="ink" hex="#1a110a" cls="bg-ink text-white" />
        </div>
      </Section>

      {/* Iconic + accents */}
      <Section title="Iconic + warm earth accents">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <Swatch name="walnut" hex="#4a2b17" cls="bg-walnut text-white" iconic />
          <Swatch name="walnut-dark" hex="#2a1608" cls="bg-walnut-dark text-white" />
          <Swatch name="brass" hex="#b5874e" cls="bg-brass text-white" />
          <Swatch name="honey" hex="#c9935b" cls="bg-honey text-white" />
          <Swatch name="moss" hex="#6b7d4a" cls="bg-moss text-white" />
          <Swatch name="moss-dark" hex="#4c5c32" cls="bg-moss-dark text-white" />
          <Swatch name="oxblood" hex="#7a2e2e" cls="bg-oxblood text-white" />
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap items-start gap-3 rounded-2xl bg-ivory border border-hairline p-6">
          <button className="rounded-lg bg-walnut hover:bg-walnut-dark text-white text-sm font-semibold px-4 py-2 transition-colors">
            Primary — Walnut
          </button>
          <button className="rounded-lg bg-moss hover:bg-moss-dark text-white text-sm font-semibold px-4 py-2 transition-colors">
            Positive — Moss
          </button>
          <button className="rounded-lg bg-brass hover:opacity-90 text-white text-sm font-semibold px-4 py-2 transition-colors">
            Featured — Brass
          </button>
          <button className="rounded-lg border border-hairline bg-paper hover:border-walnut text-ink text-sm font-semibold px-4 py-2 transition-colors">
            Secondary
          </button>
          <button className="text-sm font-semibold text-graphite hover:text-ink px-3 py-2">
            Ghost
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-oxblood hover:opacity-90 text-white text-sm font-semibold px-4 py-2 transition-colors">
            <FiTrash2 className="h-3.5 w-3.5" />
            Destructive — Oxblood
          </button>
          <button
            disabled
            className="rounded-lg bg-walnut text-white text-sm font-semibold px-4 py-2 opacity-50 cursor-not-allowed"
          >
            Disabled
          </button>
        </div>
      </Section>

      {/* Pills + chips */}
      <Section title="Pills + chips">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-ivory border border-hairline p-6">
          <Pill cls="bg-paper border border-hairline text-graphite">Planning</Pill>
          <Pill cls="bg-moss text-white">In progress</Pill>
          <Pill cls="bg-green-700 text-white">Complete</Pill>
          <Pill cls="bg-amber-600 text-white">Paused</Pill>
          <span className="inline-flex items-center gap-1 rounded-full bg-walnut/10 text-walnut-dark px-2.5 py-0.5 text-xs font-semibold">
            <FiFlag className="h-3 w-3" />
            Part of Bathroom Remodel
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brass/15 text-walnut-dark px-2.5 py-0.5 text-xs font-semibold">
            <FiFileText className="h-3 w-3 text-brass" />
            Permit
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-ivory text-ink px-2.5 py-0.5 text-xs font-medium border border-hairline">
            <FiHome className="h-3 w-3 text-walnut" />
            Renovation
          </span>
        </div>
      </Section>

      {/* Category gradients */}
      <Section title="Category gradients (for image-less cards)">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(
            [
              {
                label: "Renovation",
                icon: FiHome,
                cls: "from-honey/40 via-honey/15 to-ivory",
                accent: "text-walnut",
              },
              {
                label: "Furniture",
                icon: FiLayers,
                cls: "from-moss/30 via-moss/10 to-ivory",
                accent: "text-moss-dark",
              },
              {
                label: "Craft",
                icon: FiScissors,
                cls: "from-amber-200 via-amber-100 to-ivory",
                accent: "text-amber-800",
              },
              {
                label: "Decor",
                icon: FiImage,
                cls: "from-pink-200 via-pink-100 to-ivory",
                accent: "text-pink-800",
              },
              {
                label: "Outdoor",
                icon: FiSun,
                cls: "from-blue-200 via-blue-100 to-ivory",
                accent: "text-blue-800",
              },
            ] as const
          ).map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className={`aspect-[4/5] rounded-xl bg-gradient-to-br ${c.cls} flex flex-col items-center justify-center p-4`}
              >
                <Icon className={`h-10 w-10 ${c.accent} opacity-70 mb-2`} />
                <p className="font-display text-base text-ink">{c.label}</p>
                <p className={`text-caption ${c.accent}`}>{c.label}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Notebook grid surface */}
      <Section title="Paper grid (.bg-grid)">
        <div className="bg-grid rounded-2xl border border-hairline p-8 space-y-3">
          <p className="font-display-lg">Notebook surface</p>
          <p className="text-graphite max-w-md">
            Subtle 24px grid. Use on text-heavy heroes and empty states —
            never behind image grids. It adds workshop feel without
            competing with photos.
          </p>
          <button className="rounded-lg bg-walnut hover:bg-walnut-dark text-white text-sm font-semibold px-4 py-2">
            Try me
          </button>
        </div>
      </Section>

      {/* Milestones block */}
      <Section title="Status examples in context">
        <div className="space-y-2 rounded-2xl bg-ivory border border-hairline p-6">
          <Row
            icon={<FiFileText className="h-4 w-4 text-brass" />}
            title="Plumbing permit"
            meta="Clackamas County · due Apr 28"
            pill={{ text: "Pending", cls: "bg-paper border border-hairline text-graphite" }}
          />
          <Row
            icon={<FiCheck className="h-4 w-4 text-moss-dark" />}
            title="Demo complete"
            meta="finished Apr 14"
            pill={{ text: "Complete", cls: "bg-moss text-white" }}
          />
          <Row
            icon={<FiFlag className="h-4 w-4 text-walnut" />}
            title="Rough-in inspection"
            meta="scheduled Apr 22"
            pill={{ text: "Scheduled", cls: "bg-green-700 text-white" }}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-caption uppercase tracking-[0.15em] text-graphite">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({
  name,
  hex,
  cls,
  iconic,
}: {
  name: string;
  hex: string;
  cls: string;
  iconic?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={`relative flex aspect-[4/3] items-end justify-between rounded-xl p-3 ${cls}`}
      >
        {iconic && (
          <span className="absolute top-2 right-2 rounded-full bg-white/95 text-walnut px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            ★ Iconic
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{name}</p>
        <p className="text-[11px] font-mono text-graphite">{hex}</p>
      </div>
    </div>
  );
}

function Pill({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

function Row({
  icon,
  title,
  meta,
  pill,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  pill: { text: string; cls: string };
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-paper p-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ivory shadow-sm">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-[11px] text-graphite">{meta}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill.cls}`}
      >
        {pill.text}
      </span>
    </div>
  );
}
