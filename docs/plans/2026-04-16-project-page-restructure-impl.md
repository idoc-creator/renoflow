# Project Page Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the project page from 3 tabs (Plan / Mood Board / Shopping List) to 5 tabs (Overview / Plan / Mood Board / Budget / Photos), simplify the Bunker nav, and build the new Overview and Budget tabs that aggregate project data.

**Architecture:** Keep the existing Next.js route-based tab structure. The current `/bunker/project/[id]` becomes the new Overview tab. The current "plan view" moves to `/bunker/project/[id]/plan`. Shopping list moves from `/bunker/project/[id]/shopping-list` to live inside a new Budget tab at `/bunker/project/[id]/budget`. Photos tab is a new placeholder route. No DB schema changes needed for this pass.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, Supabase (no new deps).

**Reference design doc:** `/Users/codiguild/Documents/Obsidian Vault/docs/plans/2026-04-16-bench-project-page-restructure.md`

---

## Context

Codi used the app yesterday and identified that the project page is missing the "first look" experience. When you open a project, you currently land on the plan (stages/steps) with no project-level context. She wants to land on an Overview showing the brief, key stats, and hero image — then drill into Plan / Mood Board / Budget / Photos via tabs. She also wants Shopping List to move out of the global Bunker nav (it's project-specific) and into a Budget tab alongside the savings dashboard. Earnings gets deferred until the marketplace phase.

**Intended outcome:**
1. Open a project → land on Overview tab with brief, stats, hero photo
2. Bunker sidebar simplified to just Projects + My Toolbox
3. 5 tabs on every project: Overview, Plan, Mood Board, Budget, Photos
4. Budget tab shows savings dashboard + shopping list together
5. Photos tab exists as a placeholder for the gallery feature (to be built later)
6. Everything builds and Codi can still navigate her existing Bathroom Remodel project

**What's explicitly deferred** (do NOT build in this pass):
- Build Mode toggle on the Plan tab
- Sub-project linking (stage → linked project)
- Photos gallery upload functionality (just the tab placeholder)
- Tools/materials aggregation on the Overview
- Custom Overview layouts per project type

---

## Critical Files to Modify or Create

| Area | File | Change |
|---|---|---|
| Bunker nav | `src/app/bunker/bunker-shell.tsx` | Remove Shopping List and Earnings from `navItems` array. Keep Projects + My Toolbox. |
| Project nav | `src/components/project/ProjectNav.tsx` | Replace 3 tabs with 5 tabs. "Overview" at href="", Plan at "/plan", Mood Board at "/mood-board", Budget at "/budget", Photos at "/photos". |
| Overview (new) | `src/app/bunker/project/[id]/page.tsx` | **Replace entirely** with the new Overview view — brief, stats, hero area. The old content (plan view) moves to `/plan/page.tsx`. |
| Plan (moved) | `src/app/bunker/project/[id]/plan/page.tsx` | **New file** — takes the EXACT current content of `/bunker/project/[id]/page.tsx`. |
| Budget (new) | `src/app/bunker/project/[id]/budget/page.tsx` | **New file** — savings dashboard + shopping list. Uses existing `SavingsDashboard` component + existing `ShoppingListClient`. |
| Photos (new) | `src/app/bunker/project/[id]/photos/page.tsx` | **New file** — placeholder tab with empty state ("Gallery coming soon"). |
| Old shopping list | `src/app/bunker/project/[id]/shopping-list/` | **Delete directory** — replaced by the Budget tab. |
| Bunker shopping list (if exists) | `src/app/bunker/shopping-list/` | **Verify and delete if it exists** — nav item is being removed. |
| Bunker earnings (if exists) | `src/app/bunker/earnings/` | **Verify and delete if it exists** — nav item is being removed. |

## Reusable Pieces Already in Codebase

- `src/components/project/SavingsDashboard.tsx` — reuse on Budget tab
- `src/app/bunker/project/[id]/shopping-list/shopping-list-client.tsx` — reuse on Budget tab
- `src/components/project/StageList.tsx` — reuse on Plan tab (no changes)
- `src/components/project/ProjectNav.tsx` — modify for 5 tabs
- `src/app/bunker/project/[id]/layout.tsx` — reuse as-is (renders nav + children)

---

## Task 1: Simplify Bunker nav

**Files:**
- Modify: `src/app/bunker/bunker-shell.tsx`

**Step 1: Update the `navItems` array**

Replace:
```typescript
const navItems = [
  { href: "/bunker", label: "Projects", icon: FiHome },
  { href: "/bunker/toolbox", label: "My Toolbox", icon: FiTool },
  { href: "/bunker/shopping-list", label: "Shopping List", icon: FiShoppingCart },
  { href: "/bunker/earnings", label: "Earnings", icon: FiDollarSign },
];
```

With:
```typescript
const navItems = [
  { href: "/bunker", label: "Projects", icon: FiHome },
  { href: "/bunker/toolbox", label: "My Toolbox", icon: FiTool },
];
```

Remove unused icon imports (`FiShoppingCart`, `FiDollarSign`). Keep `FiHome`, `FiTool`, `FiLogOut`, `FiMenu`, `FiX`.

**Step 2: Check for orphaned pages**

Run these checks and delete any that exist:
- `src/app/bunker/shopping-list/` (if it exists as a standalone page — it shouldn't, but verify)
- `src/app/bunker/earnings/` (if it exists as a standalone page — it shouldn't, but verify)

If they don't exist, skip this step. Do NOT delete the project-scoped shopping list (`src/app/bunker/project/[id]/shopping-list/`) yet — that's handled in Task 5.

**Step 3: Verify build**

```bash
cd /Users/codiguild/renoflow && npm run build
```
Expected: clean build.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(bench): simplify bunker nav to Projects + My Toolbox"
```

---

## Task 2: Update ProjectNav to 5 tabs

**Files:**
- Modify: `src/components/project/ProjectNav.tsx`

**Step 1: Read the current file to understand its exact shape**

The component exports `ProjectNav` and takes `projectId: string` as a prop. It uses `usePathname()` to determine active state.

**Step 2: Update the tab definitions**

Replace the current `tabs` array with:
```typescript
const tabs = [
  { href: "", label: "Overview", icon: FiGrid },
  { href: "/plan", label: "Plan", icon: FiClipboard },
  { href: "/mood-board", label: "Mood Board", icon: FiImage },
  { href: "/budget", label: "Budget", icon: FiDollarSign },
  { href: "/photos", label: "Photos", icon: FiCamera },
];
```

Import the new icons at the top:
```typescript
import {
  FiGrid,
  FiClipboard,
  FiImage,
  FiDollarSign,
  FiCamera,
} from "react-icons/fi";
```

**Step 3: Verify active state logic still works**

The existing active-state logic should handle the new tabs. Confirm:
- Overview tab (href="") is active when pathname is exactly `/bunker/project/[id]`
- Other tabs active when pathname ends with their href

The existing code likely already handles this with `pathname === basePath` for "" and `pathname.endsWith(tab.href)` for others. If the check uses `startsWith`, it may over-match — verify by reading the file.

**Step 4: Verify build**

```bash
npm run build
```
Expected: build passes. Routes `/plan`, `/budget`, `/photos` will 404 at runtime but that's handled in later tasks.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(bench): project nav with 5 tabs (Overview/Plan/Mood Board/Budget/Photos)"
```

---

## Task 3: Move current plan view to /plan route

**Files:**
- Create: `src/app/bunker/project/[id]/plan/page.tsx`
- Modify (later in Task 4): `src/app/bunker/project/[id]/page.tsx`

**Step 1: Copy current `/bunker/project/[id]/page.tsx` to `/plan/page.tsx`**

The current page at `src/app/bunker/project/[id]/page.tsx` renders the plan (stages + savings dashboard). Copy its EXACT contents to `src/app/bunker/project/[id]/plan/page.tsx`. Do not modify the logic.

```bash
mkdir -p src/app/bunker/project/\[id\]/plan
cp src/app/bunker/project/\[id\]/page.tsx src/app/bunker/project/\[id\]/plan/page.tsx
```

Note: After copying, leave the original `page.tsx` alone. Task 4 replaces it with the new Overview.

**Step 2: Verify build**

```bash
npm run build
```

At this point both `/bunker/project/[id]` and `/bunker/project/[id]/plan` show the plan view. That's intentional — Task 4 replaces `/bunker/project/[id]` with the Overview.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(bench): duplicate plan view to /plan route"
```

---

## Task 4: Build new Overview tab

**Files:**
- Modify: `src/app/bunker/project/[id]/page.tsx` (replace contents entirely)
- Create: `src/components/project/ProjectOverview.tsx`

**Step 1: Create the ProjectOverview component**

File: `src/components/project/ProjectOverview.tsx`

```typescript
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
```

**Step 2: Replace `src/app/bunker/project/[id]/page.tsx`**

New contents:

```typescript
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProjectOverview from "@/components/project/ProjectOverview";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, name, description, category, cover_image_url, budget_total, budget_spent, contractor_estimate, diy_estimate, status"
    )
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Count stages + steps
  const { data: stages } = await supabase
    .from("stages")
    .select("id, steps(id, is_completed)")
    .eq("project_id", id);

  const stageCount = stages?.length ?? 0;
  const stepCount =
    stages?.reduce((sum, s) => sum + ((s.steps as { id: string }[])?.length ?? 0), 0) ?? 0;
  const completedStepCount =
    stages?.reduce(
      (sum, s) =>
        sum +
        ((s.steps as { is_completed: boolean }[])?.filter(
          (step) => step.is_completed
        ).length ?? 0),
      0
    ) ?? 0;

  return (
    <ProjectOverview
      project={project}
      stageCount={stageCount}
      stepCount={stepCount}
      completedStepCount={completedStepCount}
    />
  );
}
```

**Step 3: Verify build**

```bash
npm run build
```
Expected: build passes. `/bunker/project/[id]` now shows Overview; `/bunker/project/[id]/plan` shows the plan.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(bench): Overview tab with project brief, stats, and quick tab links"
```

---

## Task 5: Build Budget tab (savings + shopping list)

**Files:**
- Create: `src/app/bunker/project/[id]/budget/page.tsx`
- Read (copy pattern): `src/app/bunker/project/[id]/shopping-list/page.tsx`
- Read (copy pattern): `src/app/bunker/project/[id]/shopping-list/shopping-list-client.tsx`
- Delete at end: `src/app/bunker/project/[id]/shopping-list/` directory

**Step 1: Create the Budget page**

File: `src/app/bunker/project/[id]/budget/page.tsx`

Start by reading the current `src/app/bunker/project/[id]/shopping-list/page.tsx` to understand how it fetches stages + items. Then build a combined Budget page that:
1. Fetches the project (for savings dashboard inputs)
2. Fetches stages + shopping list items (for the shopping list)
3. Renders `<SavingsDashboard>` at the top
4. Renders `<ShoppingListClient>` below, with a section heading "Shopping list"

Approximate structure:

```typescript
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SavingsDashboard } from "@/components/project/SavingsDashboard";
import { ShoppingListClient } from "../shopping-list/shopping-list-client";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  // Fetch stages for section headers
  const { data: stages } = await supabase
    .from("stages")
    .select("id, title, actual_cost")
    .eq("project_id", id)
    .order("sort_order");

  // Fetch shopping list items
  const { data: items } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("project_id", id)
    .order("created_at");

  // Calculate actual_cost total from stages
  const actualCostTotal =
    stages?.reduce((sum, s) => sum + (Number(s.actual_cost) || 0), 0) ?? 0;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-xl text-charcoal mb-3">
          Savings & Budget
        </h2>
        <SavingsDashboard
          contractorEstimate={Number(project.contractor_estimate) || 0}
          diyEstimate={Number(project.diy_estimate) || 0}
          budgetTotal={Number(project.budget_total) || 0}
          budgetSpent={Number(project.budget_spent) || 0}
          actualCostTotal={actualCostTotal}
        />
      </section>

      <section>
        <h2 className="font-serif text-xl text-charcoal mb-3">
          Shopping list
        </h2>
        <ShoppingListClient
          projectId={id}
          initialStages={stages ?? []}
          initialItems={items ?? []}
        />
      </section>
    </div>
  );
}
```

**Verify the import path for `ShoppingListClient`:** Read the current file to confirm the export name and props shape. The existing path is `src/app/bunker/project/[id]/shopping-list/shopping-list-client.tsx`. The import `from "../shopping-list/shopping-list-client"` reaches UP from `/budget/` to `/[id]/`, then into `/shopping-list/`. This works as long as we don't delete the old directory yet.

**Step 2: Verify build**

```bash
npm run build
```
Expected: build passes, `/bunker/project/[id]/budget` route appears.

**Step 3: Move ShoppingListClient so we can delete the old directory**

Two options:
- **Option A (recommended):** Move `shopping-list-client.tsx` to `src/components/project/ShoppingListClient.tsx` (shared component). Update imports in the Budget page.
- **Option B:** Keep it inline under `/budget/` folder. Move the file to `src/app/bunker/project/[id]/budget/shopping-list-client.tsx`.

Pick Option A for cleanliness — it becomes a reusable component in the project namespace.

Do:
```bash
cp src/app/bunker/project/\[id\]/shopping-list/shopping-list-client.tsx src/components/project/ShoppingListClient.tsx
```

Then update the import in the new Budget page:
```typescript
import { ShoppingListClient } from "@/components/project/ShoppingListClient";
```

**Step 4: Delete the old shopping-list directory**

```bash
rm -rf src/app/bunker/project/\[id\]/shopping-list
```

Grep for any remaining references to the old path:
```bash
grep -rn "bunker/project.*shopping-list" src/
```
If any come up, fix them (should only be in the removed ProjectNav tab, which was already updated in Task 2).

**Step 5: Verify build**

```bash
npm run build
```
Expected: clean build, `/bunker/project/[id]/budget` works, `/bunker/project/[id]/shopping-list` no longer exists.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(bench): Budget tab combines savings dashboard and shopping list; move ShoppingListClient to components"
```

---

## Task 6: Build Photos tab (placeholder)

**Files:**
- Create: `src/app/bunker/project/[id]/photos/page.tsx`

**Step 1: Create placeholder photos page**

File: `src/app/bunker/project/[id]/photos/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FiCamera } from "react-icons/fi";

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl text-charcoal">Photos</h2>

      <div className="rounded-2xl bg-white border-2 border-dashed border-border-warm p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
          <FiCamera className="h-6 w-6 text-warm-gray" />
        </div>
        <h3 className="font-serif text-2xl text-charcoal">
          Before, during, after
        </h3>
        <p className="mt-2 text-sm text-warm-gray max-w-md mx-auto">
          Upload photos as you work. We&apos;ll turn them into share-ready
          before/after gallery shots.
        </p>
        <p className="mt-4 text-xs text-warm-gray italic">
          Photo upload coming soon.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```
Expected: `/bunker/project/[id]/photos` route appears, shows the placeholder.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(bench): Photos tab placeholder with empty state"
```

---

## Task 7: End-to-end verification + push

**Step 1: Type check + lint + build**

```bash
cd /Users/codiguild/renoflow && npm run build && npx tsc --noEmit && npm run lint
```
All must pass. ESLint may still report 2 pre-existing `<img>` warnings — ignore those.

**Step 2: Visual verification in the preview**

Start or reuse the dev preview server. Navigate through the Bathroom Remodel project:

1. `http://localhost:3001/bunker` — Bunker sidebar shows ONLY Projects + My Toolbox (no Shopping List, no Earnings)
2. Click the Bathroom Remodel project
3. Land on **Overview tab** — shows project description, category badge, stats grid (stages, progress, budget, savings), tab quick-links
4. Click **Plan** tab — shows the existing stage list with Stage 1 "Demo"
5. Click **Mood Board** tab — existing mood board UI
6. Click **Budget** tab — savings dashboard at top, shopping list below, grouped by stage
7. Click **Photos** tab — placeholder empty state "Before, during, after"
8. Back to Overview — all the tab links in the stats area work

**Step 3: Push the branch**

```bash
git push origin feat/bench-rebuild
```

The existing PR #5 gets updated with these commits.

---

## Verification Checklist

After all tasks complete:

- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes (2 pre-existing warnings OK)
- [ ] Bunker nav shows Projects + My Toolbox only
- [ ] `/bunker/project/[id]` renders Overview tab
- [ ] `/bunker/project/[id]/plan` renders the stage list
- [ ] `/bunker/project/[id]/mood-board` renders the mood board
- [ ] `/bunker/project/[id]/budget` renders savings + shopping list
- [ ] `/bunker/project/[id]/photos` renders placeholder
- [ ] `/bunker/project/[id]/shopping-list` returns 404
- [ ] ProjectNav tab bar shows 5 tabs and highlights the active one
- [ ] The existing Bathroom Remodel project loads without errors on all 5 tabs

---

## Out of Scope (Future Sessions)

- Build Mode toggle on the Plan tab
- Sub-project linking (stage → linked project FK)
- Photos gallery upload + before/during/after categorization
- Tools and materials aggregation on the Overview
- Custom Overview layouts per project type (renovation vs craft)
- Project description/cover photo editing UI (fields exist, no editor yet)
