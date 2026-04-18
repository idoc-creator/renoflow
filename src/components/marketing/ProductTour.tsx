import {
  ChatCircleDots,
  CheckSquare,
  SquaresFour,
  FileText,
} from "@phosphor-icons/react/dist/ssr";
import { PeelCard } from "./PeelCard";

/**
 * "A glance at Bench" section — stylized mini-UI mockups showing what the
 * Intake, Plan Review, Overview, and Milestones features look like.
 *
 * These are CSS-drawn approximations, not screenshots, so they stay true
 * to the current design tokens even if the actual screens drift. Goal:
 * give a pre-beta visitor a feel for the product without requiring login.
 */
export function ProductTour() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-caption uppercase tracking-[0.22em] text-walnut">
          A glance at Bench
        </p>
        <h2 className="mt-3 font-display-lg text-ink max-w-3xl">
          Here&apos;s what you get inside.
        </h2>
        <p className="mt-4 text-lg text-graphite max-w-2xl leading-relaxed">
          Four moments from the product that show how Bench turns a fuzzy
          idea into a plan you can actually execute.
        </p>

        <p className="mt-3 text-sm font-hand text-walnut">
          (hover a card — peel the photo to read the note underneath)
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-10">
          <PeelCard
            Icon={ChatCircleDots}
            eyebrow="Intake"
            title="a conversation, not a form."
            body="Bench interviews you like a contractor friend — branching by category, skipping what doesn't apply. Click a chip or type; recaps as it goes so you know what's locked in."
            mock={<IntakeMock />}
          />
          <PeelCard
            Icon={CheckSquare}
            eyebrow="Plan Review"
            title="see the whole plan, first."
            body="The AI drafts stages and steps; you flip off what you don't want, expand any stage, or ask for revisions in plain English. Only accepted stages land in your project."
            mock={<PlanReviewMock />}
          />
          <PeelCard
            Icon={SquaresFour}
            eyebrow="Overview"
            title="your project at a glance."
            body="Image-first cards. Stages, progress, budget, sub-projects — all visible without clicking. Status pills tell you what's active, what's paused, what's done."
            mock={<OverviewMock />}
          />
          <PeelCard
            Icon={FileText}
            eyebrow="Milestones + Shopping"
            title="permits, first-class."
            body="Plumbing rough-in inspection. A 6-week tile delivery. A vanity you need to order this week. Bench gates your plan against them so nothing closes a wall before it's inspected."
            mock={<MilestonesMock />}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Mini-mocks ─────────────────────────────────────────────────────────

function IntakeMock() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="flex">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-paper border border-hairline px-3 py-2 text-sm text-ink shadow-sm">
          Is this your only bathroom, or do you have a backup?
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-2">
        <span className="rounded-full border border-hairline bg-paper px-2.5 py-1 text-xs font-medium text-ink">
          Only one
        </span>
        <span className="rounded-full border border-hairline bg-paper px-2.5 py-1 text-xs font-medium text-ink">
          Have backup
        </span>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-walnut text-white px-3 py-2 text-sm shadow-sm">
          Only one
        </div>
      </div>
      <div className="rounded-lg bg-moss/10 border border-moss/30 px-3 py-2 text-xs text-moss-dark">
        <span className="font-semibold">Recap: </span>1930s Clackamas
        County · keeping the tub · DIY plumbing + tile · hiring electric.
      </div>
    </div>
  );
}

function PlanReviewMock() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <StageRow checked title="Test + Protect" hours="2h" cost="$85" />
      <StageRow checked title="Demo & haul" hours="12h" cost="$320" />
      <StageRow checked={false} title="Shower pan prep" hours="6h" cost="$240" />
      <StageRow checked title="Rough plumbing" hours="14h" cost="$380" />
      <div className="flex items-center justify-between pt-2 text-[11px]">
        <span className="text-graphite">3 of 4 accepted</span>
        <span className="rounded-md bg-walnut text-white px-2 py-1 text-[10px] font-semibold">
          Add to plan →
        </span>
      </div>
    </div>
  );
}

function StageRow({
  checked,
  title,
  hours,
  cost,
}: {
  checked: boolean;
  title: string;
  hours: string;
  cost: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
        checked
          ? "bg-paper border-hairline"
          : "bg-ivory border-hairline opacity-60"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
          checked ? "bg-moss border-moss text-white" : "bg-paper border-hairline"
        }`}
      >
        {checked && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span
        className={`flex-1 text-sm font-medium ${
          checked ? "text-ink" : "text-graphite line-through"
        }`}
      >
        {title}
      </span>
      <span className="text-[11px] text-graphite">{hours}</span>
      <span className="text-[11px] text-graphite">{cost}</span>
    </div>
  );
}

function OverviewMock() {
  return (
    <div className="w-full max-w-sm space-y-2">
      {/* card 1 */}
      <div className="flex items-start gap-3 rounded-xl bg-paper border border-hairline p-3">
        <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-honey/40 via-honey/15 to-ivory" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink truncate">
              Bathroom Remodel
            </p>
            <span className="shrink-0 rounded-full bg-moss text-white px-1.5 py-0.5 text-[9px] font-semibold">
              In progress
            </span>
          </div>
          <p className="text-[11px] text-graphite mt-0.5">
            Renovation · 7 stages · 3/19 steps
          </p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ivory">
            <div className="h-full rounded-full bg-moss" style={{ width: "16%" }} />
          </div>
        </div>
      </div>
      {/* card 2 — sub */}
      <div className="ml-6 flex items-start gap-3 rounded-xl bg-paper border border-hairline p-3">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-moss/30 via-moss/10 to-ivory" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink truncate">
              Bathroom Vanity
            </p>
            <span className="shrink-0 rounded-full bg-walnut/10 text-walnut-dark px-1.5 py-0.5 text-[9px] font-semibold">
              Part of ↑
            </span>
          </div>
          <p className="text-[11px] text-graphite mt-0.5">
            Furniture · 6 stages · 0/14 steps
          </p>
        </div>
      </div>
    </div>
  );
}

function MilestonesMock() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="rounded-xl bg-paper border border-hairline p-3 space-y-2">
        <p className="text-caption uppercase tracking-[0.18em] text-walnut">
          Milestones
        </p>
        <MiniRow
          accent="bg-brass"
          title="Plumbing rough-in inspection"
          meta="Clackamas County · Apr 28"
          pill="Pending"
        />
        <MiniRow
          accent="bg-moss-dark"
          title="Tile delivery"
          meta="4–6 weeks · order by Apr 22"
          pill="Order soon"
          pillCls="bg-walnut/10 text-walnut-dark"
        />
      </div>
      <div className="rounded-xl bg-paper border border-hairline p-3 space-y-1">
        <p className="text-caption uppercase tracking-[0.18em] text-walnut">
          Shopping
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink">Shower valve (pressure-balanced)</span>
          <span className="text-xs text-walnut">🛒 buy</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink">Penny tile · 24 sqft + 15%</span>
          <span className="text-xs text-graphite">$218</span>
        </div>
      </div>
    </div>
  );
}

function MiniRow({
  accent,
  title,
  meta,
  pill,
  pillCls = "bg-ivory text-graphite",
}: {
  accent: string;
  title: string;
  meta: string;
  pill: string;
  pillCls?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-7 w-7 shrink-0 rounded-full ${accent}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{title}</p>
        <p className="text-[11px] text-graphite">{meta}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${pillCls}`}
      >
        {pill}
      </span>
    </div>
  );
}
