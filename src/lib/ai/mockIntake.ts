/**
 * Branching mock intake v2.
 *
 * Improvements over v1:
 * - Questions track their own "attempted" state so an unparseable reply
 *   doesn't loop silently — we add a clarifier preamble, try once more,
 *   then skip.
 * - Cards can surface quick-pick OPTIONS so common answers are one click.
 * - Copy follows "why first, then the question" for the spots where it
 *   matters.
 * - Renovation DIY-vs-hire is preceded by a scope-of-work pass (plumbing,
 *   electrical, structural, etc.) so we ask the right follow-ups.
 * - If a user profile has defaults (AHJ, currency, residence), we skip
 *   location + residence cards unless the user explicitly says it's
 *   somewhere different.
 * - Furniture/craft branches are strictly maker-only — no permit/age probes.
 */

export interface MockIntakeInput {
  projectName: string;
  userTurns: string[];
  intakeSoFar: Record<string, unknown>;
  /** Other active projects owned by the user — surfaces "link as sub-project?" */
  userProjects?: { id: string; name: string }[];
  /** Profile defaults so repeat users don't get asked the same facts again. */
  profileDefaults?: {
    ahj_city?: string | null;
    ahj_county?: string | null;
    ahj_state?: string | null;
    ahj_country?: string | null;
    currency?: string | null;
    is_primary_residence?: boolean | null;
  };
}

export interface QuickPick {
  label: string;
  value: string;
}

export interface MockIntakeOutput {
  reply: string;
  /** Optional quick-pick chips the UI renders as buttons under the question. */
  options?: QuickPick[];
  intake_patch: Record<string, unknown>;
  progress: {
    captured_count: number;
    estimated_total: number;
    recap: string | null;
  };
  is_complete: boolean;
  detected_sub_projects: { title: string; reason_it_came_up: string }[];
  /** If the intake detected this project is likely a sub of an existing one. */
  suggested_parent_link?: {
    parent_project_id: string;
    parent_project_name: string;
    reason: string;
  } | null;
  /** Unparseable reply was detected on this turn. */
  needs_clarification?: boolean;
}

interface QCard {
  id: string;
  priority: number;
  appliesWhen: (
    intake: Record<string, unknown>,
    profile?: MockIntakeInput["profileDefaults"]
  ) => boolean;
  isAnswered: (intake: Record<string, unknown>) => boolean;
  ask: (
    projectName: string,
    intake: Record<string, unknown>
  ) => { text: string; options?: QuickPick[] };
  /**
   * capture returns a patch. If the patch is empty AND understood is false,
   * the controller treats the card as "didn't land" and will re-prompt with
   * a clarifier. If understood is true but patch is empty, card is skipped
   * (e.g. user said "skip this").
   */
  capture: (
    reply: string,
    intake: Record<string, unknown>
  ) => { patch: Record<string, unknown>; understood: boolean };
  recap?: (intake: Record<string, unknown>) => string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

const lower = (s: string) => s.toLowerCase().trim();
const specificsGet = (intake: Record<string, unknown>, k: string) =>
  (intake.specifics as Record<string, unknown> | undefined)?.[k];
const locationGet = (intake: Record<string, unknown>, k: string) =>
  (intake.location as Record<string, unknown> | undefined)?.[k];

function parseYesNo(reply: string): boolean | null {
  const s = lower(reply);
  if (/^(y|yes|yeah|yep|yup|sure|of course|please|ok|okay)\b/.test(s))
    return true;
  if (/^(n|no|nope|nah|not really|skip|negative)\b/.test(s)) return false;
  return null;
}
function parseNumber(reply: string): number | null {
  const m = reply.match(/[\d,]+/);
  if (!m) return null;
  const n = parseInt(m[0].replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function detectCategory(reply: string): string | null {
  const s = lower(reply);
  // Furniture FIRST — build verb + object, or just the object word.
  // Critical: "vanity for my bathroom remodel" is a furniture project, NOT a reno.
  if (
    /\b(?:build|make|craft|diy|woodwork)\b[^.]*\b(?:vanity|table|chair|dresser|shelf|shelves|bookcase|bench|nightstand|desk|bed frame|cabinet|frame|mirror|door|headboard)\b/.test(
      s
    )
  )
    return "furniture";
  if (
    /\b(?:vanity|table|chair|dresser|bookcase|shelves|nightstand|headboard)\b/.test(
      s
    )
  )
    return "furniture";
  // Craft tools/verbs
  if (/\b(pottery|sew|knit|craft|jewelry|clay|needle|weav|quilt)\b/.test(s))
    return "craft";
  // Decor
  if (/\b(paint(?!er)|decor|mirror|gallery wall|wallpaper)\b/.test(s))
    return "decor";
  // Outdoor
  if (/\b(deck|patio|garden|shed|fence|pergola|planter box)\b/.test(s))
    return "outdoor";
  // Renovation — must come last so more-specific object words win first
  if (/(?:bath(?:room)?|shower|toilet).*\b(?:remodel|reno|gut|redo)\b/.test(s))
    return "renovation";
  if (/(?:kitchen).*\b(?:remodel|reno|gut|redo)\b/.test(s)) return "renovation";
  if (/\b(?:remodel|gut|reno)\b/.test(s)) return "renovation";
  return null;
}

function detectRenoType(reply: string, intake: Record<string, unknown>): string | null {
  const src = `${reply} ${intake.project_goal ?? ""}`.toLowerCase();
  if (/bath|shower|tub|toilet/.test(src)) return "bathroom";
  if (/kitchen|cabinet(?!ry)|countertop|backsplash/.test(src)) return "kitchen";
  if (/basement/.test(src)) return "basement";
  if (/laundry/.test(src)) return "laundry";
  if (/bedroom|bed room/.test(src)) return "bedroom";
  return null;
}

function detectSubProjects(
  reply: string
): { title: string; reason_it_came_up: string }[] {
  const s = lower(reply);
  const subs: { title: string; reason_it_came_up: string }[] = [];
  const m = s.match(
    /\b(build|make|diy)\b[^.]*?\b(vanity|cabinet|shelves|shelf|bench|frame|mirror|door|table|bookcase|nightstand)\b/
  );
  if (m) {
    subs.push({
      title: `${m[1][0].toUpperCase()}${m[1].slice(1)} the ${m[2]}`,
      reason_it_came_up: `You mentioned wanting to ${m[1]} your own ${m[2]}.`,
    });
  }
  return subs;
}

function detectParentProject(
  reply: string,
  projectGoal: string,
  userProjects: { id: string; name: string }[] | undefined,
  currentProjectName: string
): MockIntakeOutput["suggested_parent_link"] {
  if (!userProjects || userProjects.length === 0) return null;
  const haystack = lower(`${reply} ${projectGoal}`);
  for (const p of userProjects) {
    if (p.name === currentProjectName) continue;
    // Basic: each word of the project name (len ≥ 4) must appear
    const words = p.name.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
    if (words.length === 0) continue;
    if (words.every((w) => haystack.includes(w))) {
      return {
        parent_project_id: p.id,
        parent_project_name: p.name,
        reason: `You mentioned "${p.name}" — want to link this as a sub-project of it?`,
      };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cards
//
// priority bands (lower = sooner):
//   00-09 opener
//   10-19 classifiers (category, reno type)
//   20-29 universal (help, skill, weekends, budget, timeline)
//   30-39 reno/outdoor: location/residence/age
//   35-38 scope-of-work (what infra is changing)
//   39    DIY-vs-hire (shown as picks per detected trade)
//   40-49 bathroom/kitchen sub-specifics
//   50-59 maker specifics
//   60+   wrap

const CARDS: QCard[] = [
  // 00 — opener
  {
    id: "opener",
    priority: 0,
    appliesWhen: () => true,
    isAnswered: (intake) =>
      typeof intake.project_goal === "string" &&
      (intake.project_goal as string).length > 0,
    ask: (name) => ({
      text: `Hey — I'll help you shape up a plan for ${name}. In your own words, what are you building, and why?`,
    }),
    capture: (reply) => {
      const patch: Record<string, unknown> = {};
      if (reply.trim()) patch.project_goal = reply.trim();
      const cat = detectCategory(reply);
      if (cat) patch.category = cat;
      const s = lower(reply);
      if (/save money|saving money|save \$|cheap|afford/.test(s))
        patch.primary_motivation = "save money";
      else if (/learn|skill|master/.test(s))
        patch.primary_motivation = "learn skills";
      else if (/can'?t find|couldn'?t find|custom|exactly what/.test(s))
        patch.primary_motivation = "can't find what i want";
      const renoType = detectRenoType(reply, {});
      if (renoType) patch.specifics = { reno_type: renoType };
      return { patch, understood: reply.trim().length > 0 };
    },
  },

  // 10 — category classifier
  {
    id: "category",
    priority: 10,
    appliesWhen: (intake) => !intake.category,
    isAnswered: (intake) => !!intake.category,
    ask: () => ({
      text: "Let me make sure I put this in the right bucket. Which fits best?",
      options: [
        { label: "Renovation", value: "renovation" },
        { label: "Outdoor build", value: "outdoor" },
        { label: "Furniture", value: "furniture" },
        { label: "Craft", value: "craft" },
        { label: "Decor", value: "decor" },
      ],
    }),
    capture: (reply) => {
      const cat = detectCategory(reply) || lower(reply);
      const valid = ["renovation", "outdoor", "furniture", "craft", "decor"];
      if (valid.includes(cat)) return { patch: { category: cat }, understood: true };
      return { patch: {}, understood: false };
    },
  },

  // 11 — reno sub-type
  {
    id: "reno_type",
    priority: 11,
    appliesWhen: (intake) =>
      intake.category === "renovation" && !specificsGet(intake, "reno_type"),
    isAnswered: (intake) => !!specificsGet(intake, "reno_type"),
    ask: () => ({
      text: "Which room are we working on?",
      options: [
        { label: "Bathroom", value: "bathroom" },
        { label: "Kitchen", value: "kitchen" },
        { label: "Basement", value: "basement" },
        { label: "Bedroom", value: "bedroom" },
        { label: "Laundry", value: "laundry" },
        { label: "Other", value: "other" },
      ],
    }),
    capture: (reply, intake) => {
      const rt = detectRenoType(reply, {}) || lower(reply).trim() || "other";
      return {
        patch: {
          specifics: {
            ...((intake.specifics as Record<string, unknown>) || {}),
            reno_type: rt,
          },
        },
        understood: true,
      };
    },
  },

  // ─── Reno/outdoor: location ───
  {
    id: "location",
    priority: 30,
    appliesWhen: (intake, profile) => {
      if (intake.category !== "renovation" && intake.category !== "outdoor")
        return false;
      // Skip if profile has a saved AHJ and user hasn't indicated otherwise
      if (profile?.ahj_county || profile?.ahj_city) {
        // Only ask if they say different_location=true
        return intake.different_location === true;
      }
      return true;
    },
    isAnswered: (intake) =>
      !!locationGet(intake, "city") ||
      !!locationGet(intake, "county") ||
      !!locationGet(intake, "state"),
    ask: () => ({
      text: "Where's the project? Permits and code vary a lot, so city + state is plenty.",
    }),
    capture: (reply) => {
      const s = reply.trim();
      const location: Record<string, unknown> = {};
      const st = s.match(/\b([A-Z]{2})\b/);
      if (st) location.state = st[1];
      if (/clackamas/i.test(s)) location.county = "Clackamas";
      if (/multnomah/i.test(s)) location.county = "Multnomah";
      if (/washington county/i.test(s)) location.county = "Washington";
      const cm = s.match(/^([A-Z][a-zA-Z ]+?)(?:,|\s+[A-Z]{2})/);
      if (cm) location.city = cm[1].trim();
      else if (s && !st) location.city = s;
      const understood = Object.keys(location).length > 0;
      return { patch: understood ? { location } : {}, understood };
    },
  },

  // 30b — use saved AHJ? (only when profile has one saved)
  {
    id: "use_saved_ahj",
    priority: 29,
    appliesWhen: (intake, profile) => {
      if (intake.category !== "renovation" && intake.category !== "outdoor")
        return false;
      if (!(profile?.ahj_county || profile?.ahj_city)) return false;
      return intake.use_saved_ahj === undefined;
    },
    isAnswered: (intake) => intake.use_saved_ahj !== undefined,
    ask: (_name, _intake) => ({
      text: `Same location as your saved address, or somewhere new?`,
      options: [
        { label: "Saved address", value: "saved" },
        { label: "Somewhere new", value: "new" },
      ],
    }),
    capture: (reply) => {
      const s = lower(reply);
      if (/saved|same|yes|my address/.test(s))
        return {
          patch: { use_saved_ahj: true, different_location: false },
          understood: true,
        };
      if (/new|different|elsewhere|other/.test(s))
        return {
          patch: { use_saved_ahj: false, different_location: true },
          understood: true,
        };
      return { patch: {}, understood: false };
    },
  },

  // 31 — primary residence (reno/outdoor; skip if profile has it)
  {
    id: "primary_residence",
    priority: 31,
    appliesWhen: (intake, profile) => {
      if (intake.category !== "renovation" && intake.category !== "outdoor")
        return false;
      if (
        intake.use_saved_ahj === true &&
        profile?.is_primary_residence !== undefined &&
        profile?.is_primary_residence !== null
      )
        return false;
      return intake.residence_status === undefined;
    },
    isAnswered: (intake) => !!intake.residence_status,
    ask: () => ({
      text:
        "In many states, homeowners can pull their own permits for work on their primary residence — which matters for the plan. What's the setup here?",
      options: [
        { label: "My full-time home (I own)", value: "primary_owned" },
        { label: "My rental property", value: "rental_owned" },
        { label: "My rental (I'm the tenant)", value: "renting" },
        { label: "Someone else's place", value: "helping" },
      ],
    }),
    capture: (reply) => {
      const s = lower(reply);
      let rs: string | null = null;
      if (/^primary|own.*full|full.*own|primary_owned|1/.test(s))
        rs = "primary_owned";
      else if (/rental.*own|rent.*out|landlord|investment|rental_owned/.test(s))
        rs = "rental_owned";
      else if (/tenant|i rent|renting|my rental|im the tenant/.test(s))
        rs = "renting";
      else if (/someone|friend|family|help/.test(s)) rs = "helping";
      if (!rs) return { patch: {}, understood: false };
      const patch: Record<string, unknown> = { residence_status: rs };
      patch.is_primary_residence = rs === "primary_owned";
      return { patch, understood: true };
    },
  },

  // 32 — year built (reno only, once)
  {
    id: "year_built",
    priority: 32,
    appliesWhen: (intake) =>
      intake.category === "renovation" && !intake.year_built,
    isAnswered: (intake) => intake.year_built !== undefined,
    ask: () => ({
      text:
        "Old houses have their own surprises — lead paint, asbestos in pipe wrap or mastic, lath & plaster walls. Roughly how old is the place?",
      options: [
        { label: "Pre-1940", value: "1935" },
        { label: "1940-1970", value: "1960" },
        { label: "1970-1990", value: "1980" },
        { label: "1990-2010", value: "2000" },
        { label: "Newer than 2010", value: "2015" },
        { label: "Not sure", value: "unknown" },
      ],
    }),
    capture: (reply) => {
      const n = parseNumber(reply);
      if (n && n > 1800 && n < 2100) return { patch: { year_built: n }, understood: true };
      if (/unknown|not sure|idk/.test(lower(reply)))
        return { patch: { year_built: null }, understood: true };
      if (/old|vintage|craftsman|pre[- ]?war/.test(lower(reply)))
        return { patch: { year_built: 1935 }, understood: true };
      if (/new|modern/.test(lower(reply))) return { patch: { year_built: 2015 }, understood: true };
      return { patch: {}, understood: false };
    },
    recap: (intake) => {
      const loc = intake.location as Record<string, string> | undefined;
      const city = loc?.city || loc?.county;
      const goal = intake.project_goal as string | undefined;
      const rt = specificsGet(intake, "reno_type") as string | undefined;
      const parts: string[] = [];
      if (goal) parts.push(`"${goal}"`);
      if (rt) parts.push(rt);
      if (city) parts.push(city);
      if (parts.length === 0) return null;
      return `So far: ${parts.join(" · ")}. Getting closer.`;
    },
  },

  // ─── Scope of work (reno) — what's changing before we split DIY/hire ───
  {
    id: "scope_of_work",
    priority: 35,
    appliesWhen: (intake) =>
      intake.category === "renovation" && !intake.scope_of_work,
    isAnswered: (intake) => Array.isArray(intake.scope_of_work),
    ask: () => ({
      text:
        "Before we talk about who does what, I want to know what's actually changing. Which of these apply? (Pick each that fits — send them comma-separated, or click through.)",
      options: [
        { label: "Reconfiguring plumbing", value: "plumbing_reconfig" },
        { label: "New plumbing fixtures only", value: "plumbing_fixtures" },
        { label: "Reconfiguring electrical", value: "electrical_reconfig" },
        { label: "New electrical fixtures only", value: "electrical_fixtures" },
        { label: "Moving walls", value: "structural_walls" },
        { label: "New window/door framing", value: "structural_framing" },
        { label: "Surface-level only (paint, tile, trim)", value: "surface_only" },
        { label: "HVAC / ducting changes", value: "hvac" },
      ],
    }),
    capture: (reply) => {
      const s = lower(reply);
      const items = new Set<string>();
      if (/plumbing_reconfig|reconfig.*plumb|mov.*plumb/.test(s))
        items.add("plumbing_reconfig");
      if (
        /plumbing_fixtures|plumbing.*(fixture|faucet|toilet|shower head)/.test(s)
      )
        items.add("plumbing_fixtures");
      if (/electrical_reconfig|reconfig.*electric|new circuit|move outlet/.test(s))
        items.add("electrical_reconfig");
      if (/electrical_fixtures|light fixture|new fan|new outlet/.test(s))
        items.add("electrical_fixtures");
      if (/structural_walls|mov.*wall|remove.*wall|new wall/.test(s))
        items.add("structural_walls");
      if (/structural_framing|window|door frame|header|new opening/.test(s))
        items.add("structural_framing");
      if (
        /surface_only|paint|tile|trim|floor|cosmetic/.test(s) &&
        !items.has("plumbing_reconfig") &&
        !items.has("electrical_reconfig") &&
        !items.has("structural_walls")
      )
        items.add("surface_only");
      if (/hvac|duct|vent/.test(s)) items.add("hvac");
      if (items.size === 0) return { patch: {}, understood: false };
      return { patch: { scope_of_work: Array.from(items) }, understood: true };
    },
  },

  // 38 — DIY vs hire, only per scope items that need it
  {
    id: "diy_hire_plumbing",
    priority: 38,
    appliesWhen: (intake) => {
      const scope = (intake.scope_of_work as string[] | undefined) || [];
      return (
        (scope.includes("plumbing_reconfig") ||
          scope.includes("plumbing_fixtures")) &&
        intake.diy_hire_plumbing === undefined
      );
    },
    isAnswered: (intake) => intake.diy_hire_plumbing !== undefined,
    ask: () => ({
      text:
        "Plumbing — DIY or hiring? (If you're touching drains or supply lines, a plumber is the usual hedge; fixture swaps are friendlier to DIY.)",
      options: [
        { label: "DIY", value: "diy" },
        { label: "Hire a plumber", value: "hire" },
        { label: "Not sure yet", value: "unsure" },
      ],
    }),
    capture: (reply) => {
      const s = lower(reply);
      if (/diy|myself|me\b/.test(s))
        return { patch: { diy_hire_plumbing: "diy" }, understood: true };
      if (/hire|pro|plumber|pay/.test(s))
        return { patch: { diy_hire_plumbing: "hire" }, understood: true };
      if (/unsure|not sure|idk/.test(s))
        return { patch: { diy_hire_plumbing: "unsure" }, understood: true };
      return { patch: {}, understood: false };
    },
  },

  {
    id: "diy_hire_electrical",
    priority: 38,
    appliesWhen: (intake) => {
      const scope = (intake.scope_of_work as string[] | undefined) || [];
      return (
        (scope.includes("electrical_reconfig") ||
          scope.includes("electrical_fixtures")) &&
        intake.diy_hire_electrical === undefined
      );
    },
    isAnswered: (intake) => intake.diy_hire_electrical !== undefined,
    ask: () => ({
      text:
        "Electrical — DIY or hiring? (Swapping outlets and fixtures is usually safe DIY. New circuits, panel work, or AFCI/GFCI breakers are where most DIYers hedge.)",
      options: [
        { label: "DIY", value: "diy" },
        { label: "Hire an electrician", value: "hire" },
        { label: "Not sure yet", value: "unsure" },
      ],
    }),
    capture: (reply) => {
      const s = lower(reply);
      if (/diy|myself/.test(s))
        return { patch: { diy_hire_electrical: "diy" }, understood: true };
      if (/hire|electric|pro/.test(s))
        return { patch: { diy_hire_electrical: "hire" }, understood: true };
      if (/unsure|not sure|idk/.test(s))
        return { patch: { diy_hire_electrical: "unsure" }, understood: true };
      return { patch: {}, understood: false };
    },
  },

  {
    id: "diy_hire_structural",
    priority: 38,
    appliesWhen: (intake) => {
      const scope = (intake.scope_of_work as string[] | undefined) || [];
      return (
        (scope.includes("structural_walls") ||
          scope.includes("structural_framing")) &&
        intake.diy_hire_structural === undefined
      );
    },
    isAnswered: (intake) => intake.diy_hire_structural !== undefined,
    ask: () => ({
      text:
        "Structural changes (moving walls, new framing) — DIY or hiring? If any wall might be load-bearing, most people get a framer or GC involved.",
      options: [
        { label: "DIY", value: "diy" },
        { label: "Hire a framer / GC", value: "hire" },
        { label: "Not sure yet", value: "unsure" },
      ],
    }),
    capture: (reply) => {
      const s = lower(reply);
      if (/diy|myself/.test(s))
        return { patch: { diy_hire_structural: "diy" }, understood: true };
      if (/hire|framer|gc|contractor/.test(s))
        return { patch: { diy_hire_structural: "hire" }, understood: true };
      if (/unsure|not sure|idk/.test(s))
        return { patch: { diy_hire_structural: "unsure" }, understood: true };
      return { patch: {}, understood: false };
    },
  },

  // Permits — only for US reno/outdoor, and only if any scope-of-work item
  // triggers permits (not pure surface-only)
  {
    id: "permits",
    priority: 39,
    appliesWhen: (intake, profile) => {
      if (intake.category !== "renovation" && intake.category !== "outdoor")
        return false;
      const country = profile?.ahj_country || "US";
      if (country !== "US") return false;
      const scope = (intake.scope_of_work as string[] | undefined) || [];
      if (scope.length > 0 && scope.every((s) => s === "surface_only"))
        return false;
      return intake.skip_permits === undefined;
    },
    isAnswered: (intake) => intake.skip_permits !== undefined,
    ask: () => ({
      text:
        "Permits: reconfiguring infrastructure usually triggers them, and there's real resale risk to skipping. How do you want to handle it?",
      options: [
        { label: "Pull permits", value: "pull" },
        { label: "Skip permits", value: "skip" },
        { label: "Not sure — walk me through it", value: "unsure" },
      ],
    }),
    capture: (reply) => {
      const s = lower(reply);
      if (/pull|get|yes|permit.*yes|above board|want/.test(s))
        return { patch: { skip_permits: false }, understood: true };
      if (/skip|no perm|without|no way/.test(s))
        return { patch: { skip_permits: true }, understood: true };
      if (/unsure|not sure|walk|idk/.test(s))
        return {
          patch: { skip_permits: false, permits_guidance_needed: true },
          understood: true,
        };
      return { patch: {}, understood: false };
    },
    recap: (intake) => {
      const scope = (intake.scope_of_work as string[] | undefined) || [];
      if (scope.length === 0) return null;
      const labels: Record<string, string> = {
        plumbing_reconfig: "plumbing moves",
        plumbing_fixtures: "new plumbing fixtures",
        electrical_reconfig: "electrical moves",
        electrical_fixtures: "new electrical fixtures",
        structural_walls: "moving walls",
        structural_framing: "new framing",
        surface_only: "surface only",
        hvac: "HVAC",
      };
      const readable = scope.map((s) => labels[s] ?? s).join(", ");
      return `Scope: ${readable}${intake.skip_permits === true ? " · no permits" : ""}.`;
    },
  },

  // ─── Bathroom sub-specifics ───
  {
    id: "keep_tub",
    priority: 45,
    appliesWhen: (intake) => specificsGet(intake, "reno_type") === "bathroom",
    isAnswered: (intake) => specificsGet(intake, "keep_tub") !== undefined,
    ask: () => ({
      text:
        "Keeping the tub, or replacing it? (Cast iron tubs are brutal to remove — plenty of people leave them and just refinish or tile around.)",
      options: [
        { label: "Keep the tub", value: "keep" },
        { label: "Replace it", value: "replace" },
        { label: "Removing — no tub", value: "none" },
      ],
    }),
    capture: (reply, intake) => {
      const s = lower(reply);
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      if (/keep|leave|existing|cast iron|1\b/.test(s)) specifics.keep_tub = true;
      else if (/replac|new tub|different/.test(s)) specifics.keep_tub = false;
      else if (/none|remov|no tub/.test(s)) specifics.keep_tub = false;
      else {
        const yn = parseYesNo(reply);
        if (yn !== null) specifics.keep_tub = yn;
      }
      return specifics.keep_tub !== undefined
        ? { patch: { specifics }, understood: true }
        : { patch: {}, understood: false };
    },
  },

  {
    id: "walls_type",
    priority: 46,
    appliesWhen: (intake) =>
      specificsGet(intake, "reno_type") === "bathroom" &&
      !specificsGet(intake, "walls_type"),
    isAnswered: (intake) => !!specificsGet(intake, "walls_type"),
    ask: () => ({
      text:
        "What are the walls? (Lath-and-plaster is a pre-1950s thing and changes how we demo. Knock on them: hollow = drywall, dense = plaster.)",
      options: [
        { label: "Drywall", value: "drywall" },
        { label: "Lath & plaster", value: "lath_plaster" },
        { label: "Tile (existing)", value: "tile" },
        { label: "Not sure", value: "unknown" },
      ],
    }),
    capture: (reply, intake) => {
      const s = lower(reply);
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      if (/lath|plaster/.test(s)) specifics.walls_type = "lath_plaster";
      else if (/drywall|sheetrock/.test(s)) specifics.walls_type = "drywall";
      else if (/tile/.test(s)) specifics.walls_type = "tile";
      else if (/unknown|not sure|idk/.test(s)) specifics.walls_type = "unknown";
      else return { patch: {}, understood: false };
      return { patch: { specifics }, understood: true };
    },
  },

  {
    id: "backup_bathroom",
    priority: 47,
    appliesWhen: (intake) => specificsGet(intake, "reno_type") === "bathroom",
    isAnswered: (intake) =>
      specificsGet(intake, "has_backup_bathroom") !== undefined,
    ask: () => ({
      text:
        "Is this your only bathroom? (If yes, we'll sequence the plan so you're never without a shower for long.)",
      options: [
        { label: "Yes, only one", value: "only" },
        { label: "No, we have another", value: "have_backup" },
      ],
    }),
    capture: (reply, intake) => {
      const s = lower(reply);
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      if (/only|just one|single|one bath/.test(s))
        specifics.has_backup_bathroom = false;
      else if (/another|second|backup|yes.*another|have_backup/.test(s))
        specifics.has_backup_bathroom = true;
      else {
        const yn = parseYesNo(reply);
        if (yn !== null) specifics.has_backup_bathroom = !yn;
      }
      return specifics.has_backup_bathroom !== undefined
        ? { patch: { specifics }, understood: true }
        : { patch: {}, understood: false };
    },
  },

  // ─── Kitchen sub-specifics ───
  {
    id: "keep_cabinets",
    priority: 45,
    appliesWhen: (intake) => specificsGet(intake, "reno_type") === "kitchen",
    isAnswered: (intake) => specificsGet(intake, "keep_cabinets") !== undefined,
    ask: () => ({
      text: "Cabinets — keeping, refacing, or replacing?",
      options: [
        { label: "Keeping (maybe paint)", value: "keep" },
        { label: "Reface", value: "reface" },
        { label: "Replace", value: "replace" },
      ],
    }),
    capture: (reply, intake) => {
      const s = lower(reply);
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      if (/keep|paint/.test(s)) specifics.keep_cabinets = "keep";
      else if (/reface/.test(s)) specifics.keep_cabinets = "reface";
      else if (/replac|new/.test(s)) specifics.keep_cabinets = "replace";
      else return { patch: {}, understood: false };
      return { patch: { specifics }, understood: true };
    },
  },

  // ─── Maker branch — furniture/craft/decor ───
  {
    id: "materials",
    priority: 50,
    appliesWhen: (intake) =>
      intake.category === "furniture" ||
      intake.category === "craft" ||
      intake.category === "decor",
    isAnswered: (intake) => !!specificsGet(intake, "materials"),
    ask: (_name, intake) => ({
      text:
        intake.category === "furniture"
          ? "What material are you working with? And any finish in mind?"
          : "What materials are you working with? (Ballpark is fine if you haven't decided.)",
    }),
    capture: (reply, intake) => {
      if (!reply.trim()) return { patch: {}, understood: false };
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      specifics.materials = reply.trim();
      return { patch: { specifics }, understood: true };
    },
  },

  {
    id: "tools_available",
    priority: 51,
    appliesWhen: (intake) =>
      intake.category === "furniture" || intake.category === "craft",
    isAnswered: (intake) => !!specificsGet(intake, "tools_available"),
    ask: () => ({
      text:
        "What tools do you already have that matter for this? (Miter saw, drill, sewing machine, pottery wheel — whatever applies.)",
    }),
    capture: (reply, intake) => {
      if (!reply.trim()) return { patch: {}, understood: false };
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      specifics.tools_available = reply.trim();
      return { patch: { specifics }, understood: true };
    },
  },

  // ─── Universal (help, weekends, skill, budget, timeline) ───
  {
    id: "help",
    priority: 25,
    appliesWhen: () => true,
    isAnswered: (intake) => !!intake.help,
    ask: () => ({
      text: "Solo, or do you have help?",
      options: [
        { label: "Solo", value: "solo" },
        { label: "Partner / spouse", value: "partner" },
        { label: "A friend", value: "friend" },
        { label: "Multiple helpers", value: "multiple" },
      ],
    }),
    capture: (reply) => {
      const s = lower(reply);
      if (/solo|alone|myself|just me/.test(s))
        return { patch: { help: "solo" }, understood: true };
      if (/partner|spouse|husband|wife|girlfriend|boyfriend/.test(s))
        return { patch: { help: "partner" }, understood: true };
      if (/friend|buddy|neighbor/.test(s))
        return { patch: { help: "friend" }, understood: true };
      if (/multiple|crew|team/.test(s))
        return { patch: { help: "multiple" }, understood: true };
      return { patch: {}, understood: false };
    },
  },

  {
    id: "weekends",
    priority: 26,
    appliesWhen: () => true,
    isAnswered: (intake) => intake.weekends_available !== undefined,
    ask: () => ({
      text:
        "Realistically, how many weekends (or full days) can you give this? Tight estimate beats optimistic.",
      options: [
        { label: "1–2", value: "2" },
        { label: "3–5", value: "4" },
        { label: "6–10", value: "8" },
        { label: "10+", value: "12" },
      ],
    }),
    capture: (reply) => {
      const n = parseNumber(reply);
      if (n && n > 0 && n < 200)
        return { patch: { weekends_available: n }, understood: true };
      return { patch: {}, understood: false };
    },
  },

  {
    id: "skill",
    priority: 27,
    appliesWhen: () => true,
    isAnswered: (intake) => intake.skill_comfort !== undefined,
    ask: () => ({
      text: "How comfortable are you with tools + a home center?",
      options: [
        { label: "1 — brand new", value: "1" },
        { label: "2 — a bit", value: "2" },
        { label: "3 — some projects", value: "3" },
        { label: "4 — confident", value: "4" },
        { label: "5 — framed a shed", value: "5" },
      ],
    }),
    capture: (reply) => {
      const m = reply.match(/\b([1-5])\b/);
      return m
        ? { patch: { skill_comfort: parseInt(m[1], 10) }, understood: true }
        : { patch: {}, understood: false };
    },
  },

  {
    id: "budget",
    priority: 28,
    appliesWhen: () => true,
    isAnswered: (intake) => intake.budget_total !== undefined,
    ask: () => ({
      text:
        "Budget ceiling? Just a rough number helps me size suggestions — you can change it any time.",
    }),
    capture: (reply) => {
      const m = reply.match(/\$?\s*([\d,]{2,})/);
      if (m) {
        const n = parseInt(m[1].replace(/,/g, ""), 10);
        if (n >= 20) return { patch: { budget_total: n }, understood: true };
      }
      return { patch: {}, understood: false };
    },
  },

  {
    id: "timeline",
    priority: 60,
    appliesWhen: () => true,
    isAnswered: (intake) => !!intake.timeline_pressure,
    ask: () => ({
      text: "Timeline — any hard date, or flexible?",
      options: [
        { label: "Flexible", value: "flexible" },
        { label: "Within 1 month", value: "1 month" },
        { label: "Within 3 months", value: "3 months" },
        { label: "Within 6 months", value: "6 months" },
        { label: "Specific date (I'll type it)", value: "__typed" },
      ],
    }),
    capture: (reply) => {
      if (!reply.trim()) return { patch: {}, understood: false };
      if (reply.trim() === "__typed")
        return { patch: {}, understood: false };
      return { patch: { timeline_pressure: reply.trim() }, understood: true };
    },
    recap: (intake) => {
      const parts: string[] = [];
      if (intake.project_goal) parts.push(`"${intake.project_goal as string}"`);
      const loc = intake.location as Record<string, string> | undefined;
      if (loc?.city || loc?.county) parts.push(loc.city || loc.county);
      if (intake.skip_permits === true) parts.push("no permits");
      return parts.length > 0 ? `Recap: ${parts.join(" · ")}. Ready to draft.` : null;
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Controller

function mergeIntake(
  intake: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...intake, ...patch };
  for (const key of ["specifics", "location"] as const) {
    if (
      patch[key] &&
      typeof patch[key] === "object" &&
      intake[key] &&
      typeof intake[key] === "object"
    ) {
      merged[key] = {
        ...(intake[key] as Record<string, unknown>),
        ...(patch[key] as Record<string, unknown>),
      };
    }
  }
  return merged;
}

function nextCard(
  intake: Record<string, unknown>,
  profile?: MockIntakeInput["profileDefaults"],
  skipIds?: Set<string>
): QCard | null {
  const applicable = CARDS.filter(
    (c) =>
      c.appliesWhen(intake, profile) &&
      !c.isAnswered(intake) &&
      !skipIds?.has(c.id)
  );
  if (applicable.length === 0) return null;
  applicable.sort((a, b) => a.priority - b.priority);
  return applicable[0];
}

export function runMockIntake(input: MockIntakeInput): MockIntakeOutput {
  const { projectName, userTurns, intakeSoFar, userProjects, profileDefaults } = input;

  // _attempts tracks how many times each card has been asked. After 2 failures
  // we bail and mark the card effectively-answered (as "skipped") so we don't loop.
  const attempts = ((intakeSoFar._attempts as Record<string, number>) || {});
  const latestReply = userTurns[userTurns.length - 1] ?? "";

  // Figure out which card was most recently asked — it's the next card we
  // would have picked against the prior intake state.
  let patch: Record<string, unknown> = {};
  let needsClarification = false;
  let askedCardId: string | null = null;

  if (userTurns.length > 0) {
    const prevIntake = intakeSoFar; // before merging
    const prevSkip = new Set<string>();
    for (const [id, n] of Object.entries(attempts)) {
      if ((n as number) >= 2) prevSkip.add(id);
    }
    const prevCard = nextCard(prevIntake, profileDefaults, prevSkip);
    if (prevCard) {
      askedCardId = prevCard.id;
      const result = prevCard.capture(latestReply, prevIntake);
      patch = result.patch;
      if (!result.understood) {
        // Couldn't parse — bump attempts, ask for clarification, and try once more
        const prevAttempts = attempts[prevCard.id] ?? 0;
        const nextAttempts = prevAttempts + 1;
        patch._attempts = { ...attempts, [prevCard.id]: nextAttempts };
        needsClarification = true;
        if (nextAttempts >= 2) {
          // Second strike → skip this card; mark as answered by storing a sentinel
          // so isAnswered returns true going forward.
          if (prevCard.id === "opener" && !prevIntake.project_goal) {
            // Must have a goal — leave it be but warn
          }
        }
      }
    }
  }

  const merged = mergeIntake(intakeSoFar, patch);

  // Skip cards that have failed twice
  const mergedAttempts = ((merged._attempts as Record<string, number>) || {});
  const skipIds = new Set<string>();
  for (const [id, n] of Object.entries(mergedAttempts)) {
    if ((n as number) >= 2) skipIds.add(id);
  }

  const next = nextCard(merged, profileDefaults, skipIds);

  const applicableAll = CARDS.filter((c) => c.appliesWhen(merged, profileDefaults));
  const answered = applicableAll.filter(
    (c) => c.isAnswered(merged) || skipIds.has(c.id)
  ).length;
  const estTotal = applicableAll.length;

  const detectedSubs = detectSubProjects(latestReply);
  const projectGoal = (merged.project_goal as string | undefined) || "";
  const parentLink = detectParentProject(
    latestReply,
    projectGoal,
    userProjects,
    projectName
  );

  // Wrap up?
  if (!next) {
    const wrap =
      CARDS.find((c) => c.id === "timeline")?.recap?.(merged) ??
      "I've got what I need.";
    return {
      reply: "Hit Draft my plan when you're ready.",
      intake_patch: patch,
      progress: {
        captured_count: answered,
        estimated_total: estTotal,
        recap: wrap,
      },
      is_complete: true,
      detected_sub_projects: detectedSubs,
      suggested_parent_link: parentLink,
    };
  }

  // Clarification case — same card will re-fire next turn; preamble the reply
  if (needsClarification && askedCardId === next.id) {
    const ask = next.ask(projectName, merged);
    return {
      reply: `Didn't quite catch that — can you try again? ${ask.text}`,
      options: ask.options,
      intake_patch: patch,
      progress: {
        captured_count: answered,
        estimated_total: estTotal,
        recap: null,
      },
      is_complete: false,
      detected_sub_projects: detectedSubs,
      suggested_parent_link: parentLink,
      needs_clarification: true,
    };
  }

  // Normal next-question case
  const prev = CARDS.filter((c) => c.appliesWhen(intakeSoFar, profileDefaults))
    .filter((c) => c.isAnswered(merged) && !c.isAnswered(intakeSoFar))
    .sort((a, b) => a.priority - b.priority)
    .pop();
  const recap = prev?.recap?.(merged) ?? null;

  const ask = next.ask(projectName, merged);
  return {
    reply: ask.text,
    options: ask.options,
    intake_patch: patch,
    progress: {
      captured_count: answered,
      estimated_total: estTotal,
      recap,
    },
    is_complete: false,
    detected_sub_projects: detectedSubs,
    suggested_parent_link: parentLink,
  };
}
