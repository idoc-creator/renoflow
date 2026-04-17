/**
 * Branching mock intake. Instead of a linear 10-question script, we keep a
 * registry of Q cards. On every turn the controller picks the highest-priority
 * unanswered, applicable question given what we've already captured — so a
 * bathroom remodel gets bathroom questions, a craft project never hears the
 * word "permit," and small projects can end early.
 */

export interface MockIntakeInput {
  projectName: string;
  userTurns: string[];
  intakeSoFar: Record<string, unknown>;
}

export interface MockIntakeOutput {
  reply: string;
  intake_patch: Record<string, unknown>;
  progress: {
    captured_count: number;
    estimated_total: number;
    recap: string | null;
  };
  is_complete: boolean;
  detected_sub_projects: { title: string; reason_it_came_up: string }[];
}

interface QCard {
  /** stable id, also doubles as the "I've asked this" key */
  id: string;
  /** lower = asked sooner among applicable cards */
  priority: number;
  /** Should this card fire given what we know so far? */
  appliesWhen: (intake: Record<string, unknown>) => boolean;
  /** Has this card already been answered? (checked after capture) */
  isAnswered: (intake: Record<string, unknown>) => boolean;
  ask: (projectName: string, intake: Record<string, unknown>) => string;
  capture: (reply: string, intake: Record<string, unknown>) => Record<string, unknown>;
  /** Optional recap string to show after this turn. */
  recap?: (intake: Record<string, unknown>) => string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

const lower = (s: string) => s.toLowerCase();
const has = (obj: Record<string, unknown>, ...keys: string[]) =>
  keys.every((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== "");
const specificsGet = (intake: Record<string, unknown>, k: string) =>
  (intake.specifics as Record<string, unknown> | undefined)?.[k];
const locationGet = (intake: Record<string, unknown>, k: string) =>
  (intake.location as Record<string, unknown> | undefined)?.[k];

function parseYesNo(reply: string): boolean | null {
  const s = lower(reply).trim();
  if (/^(yes|y|yeah|yep|yup|sure|of course|please)\b/.test(s)) return true;
  if (/^(no|n|nope|nah|not really|skip)\b/.test(s)) return false;
  if (/skip|without/.test(s)) return false;
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
  if (/bath(room)?|shower|toilet|vanity/.test(s)) return "renovation";
  if (/kitchen/.test(s)) return "renovation";
  if (/reno|gut|remodel/.test(s)) return "renovation";
  if (/deck|patio|garden|shed|fence|pergola/.test(s)) return "outdoor";
  if (/table|chair|dresser|shelf|shelves|bookcase|bench|furniture|nightstand|desk/.test(s))
    return "furniture";
  if (/paint(?!er)|decor|mirror|gallery wall/.test(s)) return "decor";
  if (/pottery|sew|knit|craft|jewelry|clay|needle|weav/.test(s)) return "craft";
  return null;
}

/** Detect bathroom vs kitchen vs other within renovation. */
function detectRenoType(reply: string, intake: Record<string, unknown>): string | null {
  const src = `${reply} ${intake.project_goal ?? ""}`.toLowerCase();
  if (/bath|shower|tub|toilet|vanity/.test(src)) return "bathroom";
  if (/kitchen|cabinet|countertop|backsplash/.test(src)) return "kitchen";
  return null;
}

function detectSubProjects(
  reply: string
): { title: string; reason_it_came_up: string }[] {
  const s = lower(reply);
  const subs: { title: string; reason_it_came_up: string }[] = [];
  const m = s.match(/\b(build|make|diy)\b[^.]*?\b(vanity|cabinet|shelves|shelf|bench|frame|mirror|door|table|bookcase)\b/);
  if (m) {
    const verb = m[1];
    const noun = m[2];
    subs.push({
      title: `${verb[0].toUpperCase()}${verb.slice(1)} the ${noun}`,
      reason_it_came_up: `You mentioned wanting to ${verb} your own ${noun}.`,
    });
  }
  return subs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card definitions
//
// priority bands:
//   00-09 opener (always first)
//   10-19 scope classifiers (category, reno type)
//   20-29 situational universal (help, weekends, skill, budget, timeline)
//   30-39 renovation-specifics (location, age, permits, DIY scope)
//   40-49 bathroom/kitchen sub-specifics
//   50-59 maker-branch specifics (furniture/craft)
//   60+   wrap-up / nice-to-have

const CARDS: QCard[] = [
  // 00 — opener (no prior reply expected)
  {
    id: "opener",
    priority: 0,
    appliesWhen: () => true,
    isAnswered: (intake) => has(intake, "project_goal"),
    ask: (name) =>
      `Hey! I'll help you shape up a plan for ${name}. Before I draft anything, I want to get a feel for what you're doing. In your own words — what are you building, and why?`,
    capture: (reply) => {
      const patch: Record<string, unknown> = {};
      if (reply.trim()) patch.project_goal = reply.trim();
      const cat = detectCategory(reply);
      if (cat) patch.category = cat;
      if (/save money|saving money|save \$|cheap|afford/.test(lower(reply)))
        patch.primary_motivation = "save money";
      else if (/learn|skill|master/.test(lower(reply)))
        patch.primary_motivation = "learn skills";
      else if (/can't find|couldn't find|custom/.test(lower(reply)))
        patch.primary_motivation = "can't find what i want";
      // Plant a reno-type hint too, if possible
      const renoType = detectRenoType(reply, {});
      if (renoType) {
        patch.specifics = { reno_type: renoType };
      }
      return patch;
    },
  },

  // 10 — category fallback if the opener didn't pin it
  {
    id: "category",
    priority: 10,
    appliesWhen: (intake) => !intake.category,
    isAnswered: (intake) => !!intake.category,
    ask: () =>
      `Which of these fits best — renovation, outdoor build, furniture, craft, or decor? Just pick one.`,
    capture: (reply) => {
      const cat = detectCategory(reply);
      return cat ? { category: cat } : {};
    },
  },

  // 11 — reno type (only for renovation)
  {
    id: "reno_type",
    priority: 11,
    appliesWhen: (intake) =>
      intake.category === "renovation" && !specificsGet(intake, "reno_type"),
    isAnswered: (intake) => !!specificsGet(intake, "reno_type"),
    ask: () =>
      `Is this a bathroom, kitchen, or something else? (E.g. basement, laundry, bedroom.)`,
    capture: (reply, intake) => {
      const renoType = detectRenoType(reply, {}) ?? (lower(reply).trim() || "other");
      return {
        specifics: {
          ...((intake.specifics as Record<string, unknown>) || {}),
          reno_type: renoType,
        },
      };
    },
  },

  // ──── Renovation & outdoor branch (location/age/permits/DIY scope) ─────

  // 30 — location
  {
    id: "location",
    priority: 30,
    appliesWhen: (intake) =>
      intake.category === "renovation" || intake.category === "outdoor",
    isAnswered: (intake) =>
      !!locationGet(intake, "city") ||
      !!locationGet(intake, "county") ||
      !!locationGet(intake, "state"),
    ask: () =>
      `Where's the project happening? City + state is plenty. (Permits + code vary a lot by jurisdiction.)`,
    capture: (reply) => {
      const s = reply.trim();
      const location: Record<string, unknown> = {};
      const stateMatch = s.match(/\b([A-Z]{2})\b/);
      if (stateMatch) location.state = stateMatch[1];
      if (/clackamas/i.test(s)) location.county = "Clackamas";
      if (/multnomah/i.test(s)) location.county = "Multnomah";
      if (/washington county/i.test(s)) location.county = "Washington";
      const cityMatch = s.match(/^([A-Z][a-zA-Z ]+?)(?:,|\s+[A-Z]{2})/);
      if (cityMatch) location.city = cityMatch[1].trim();
      else if (s && !stateMatch) location.city = s;
      return Object.keys(location).length > 0 ? { location } : {};
    },
  },

  // 31 — primary residence
  {
    id: "primary_residence",
    priority: 31,
    appliesWhen: (intake) =>
      intake.category === "renovation" || intake.category === "outdoor",
    isAnswered: (intake) => intake.is_primary_residence !== undefined,
    ask: () =>
      `Is this your own home that you live in full-time? (In some states that unlocks homeowner permits you can pull yourself.)`,
    capture: (reply) => {
      const yn = parseYesNo(reply);
      return yn === null ? {} : { is_primary_residence: yn };
    },
  },

  // 32 — year built
  {
    id: "year_built",
    priority: 32,
    appliesWhen: (intake) =>
      intake.category === "renovation" && !intake.year_built,
    isAnswered: (intake) => intake.year_built !== undefined,
    ask: () =>
      `How old is the house? Year built if you know, or a rough era — pre-1980 opens up questions around lead + asbestos that we'll want to plan for.`,
    capture: (reply) => {
      const n = parseNumber(reply);
      if (n && n > 1800 && n < 2100) return { year_built: n };
      if (/old|vintage|craftsman|1920|1930|1940|pre[- ]?war/.test(lower(reply)))
        return { year_built: 1935 };
      if (/new|modern|2000|2010/.test(lower(reply))) return { year_built: 2005 };
      return {};
    },
    recap: (intake) => {
      const loc = intake.location as Record<string, string> | undefined;
      const city = loc?.city || loc?.county || "your area";
      const goal = (intake.project_goal as string) || "your project";
      const rt = specificsGet(intake, "reno_type") as string | undefined;
      return `So far: "${goal}"${rt ? ` (${rt})` : ""} in ${city}${intake.is_primary_residence === true ? ", your own place" : ""}. Getting closer — let's nail the specifics.`;
    },
  },

  // ──── Bathroom-specific (only fires for bathrooms) ─────

  // 40 — keep vs replace tub
  {
    id: "keep_tub",
    priority: 40,
    appliesWhen: (intake) => specificsGet(intake, "reno_type") === "bathroom",
    isAnswered: (intake) => specificsGet(intake, "keep_tub") !== undefined,
    ask: () =>
      `Keeping the tub or replacing it? (Cast iron tubs are a pain to remove — plenty of people leave them.)`,
    capture: (reply, intake) => {
      const s = lower(reply);
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      if (/keep|leave|existing|cast iron/.test(s)) specifics.keep_tub = true;
      else if (/replac|new tub|different/.test(s)) specifics.keep_tub = false;
      else {
        const yn = parseYesNo(reply);
        if (yn !== null) specifics.keep_tub = yn;
      }
      return specifics.keep_tub !== undefined ? { specifics } : {};
    },
  },

  // 41 — walls type
  {
    id: "walls_type",
    priority: 41,
    appliesWhen: (intake) =>
      specificsGet(intake, "reno_type") === "bathroom" &&
      !specificsGet(intake, "walls_type"),
    isAnswered: (intake) => !!specificsGet(intake, "walls_type"),
    ask: () =>
      `What are the walls — drywall, tile, or lath & plaster? (If you're not sure, knock on them: hollow thud = drywall, dense = plaster.)`,
    capture: (reply, intake) => {
      const s = lower(reply);
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      if (/lath|plaster/.test(s)) specifics.walls_type = "lath_plaster";
      else if (/drywall|sheetrock/.test(s)) specifics.walls_type = "drywall";
      else if (/tile/.test(s)) specifics.walls_type = "tile";
      else specifics.walls_type = "unknown";
      return { specifics };
    },
  },

  // 42 — backup bathroom (affects pacing/pressure)
  {
    id: "backup_bathroom",
    priority: 42,
    appliesWhen: (intake) => specificsGet(intake, "reno_type") === "bathroom",
    isAnswered: (intake) =>
      specificsGet(intake, "has_backup_bathroom") !== undefined,
    ask: () =>
      `Is this your only bathroom, or do you have another one in the house?`,
    capture: (reply, intake) => {
      const s = lower(reply);
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      if (/only|just one|single|one bath/.test(s)) specifics.has_backup_bathroom = false;
      else if (/another|second|backup|yes|multiple/.test(s))
        specifics.has_backup_bathroom = true;
      else {
        const yn = parseYesNo(reply);
        if (yn !== null) specifics.has_backup_bathroom = yn;
      }
      return specifics.has_backup_bathroom !== undefined ? { specifics } : {};
    },
  },

  // ──── Kitchen-specific ─────

  {
    id: "keep_cabinets",
    priority: 40,
    appliesWhen: (intake) => specificsGet(intake, "reno_type") === "kitchen",
    isAnswered: (intake) => specificsGet(intake, "keep_cabinets") !== undefined,
    ask: () => `Keeping the existing cabinets, or replacing them? (Painting counts as keeping.)`,
    capture: (reply, intake) => {
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      const s = lower(reply);
      if (/keep|paint|refinish/.test(s)) specifics.keep_cabinets = true;
      else if (/replac|new/.test(s)) specifics.keep_cabinets = false;
      return specifics.keep_cabinets !== undefined ? { specifics } : {};
    },
  },
  {
    id: "kitchen_layout_change",
    priority: 41,
    appliesWhen: (intake) => specificsGet(intake, "reno_type") === "kitchen",
    isAnswered: (intake) => specificsGet(intake, "layout_change") !== undefined,
    ask: () => `Moving any plumbing or walls, or keeping the layout?`,
    capture: (reply, intake) => {
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      const s = lower(reply);
      if (/mov|relocat|wall|layout chang|new layout/.test(s))
        specifics.layout_change = true;
      else if (/keep|same|existing/.test(s)) specifics.layout_change = false;
      return specifics.layout_change !== undefined ? { specifics } : {};
    },
  },

  // ──── DIY scope + permits (reno + outdoor) ─────

  {
    id: "diy_scope",
    priority: 33,
    appliesWhen: (intake) =>
      intake.category === "renovation" || intake.category === "outdoor",
    isAnswered: (intake) =>
      (intake.diy_scope as string[] | undefined)?.length !== undefined ||
      (intake.hired_scope as string[] | undefined)?.length !== undefined,
    ask: () =>
      `What parts are you doing yourself vs hiring out? (e.g. "demo + plumbing DIY, hiring an electrician" — whatever the split is.)`,
    capture: (reply) => {
      const s = lower(reply);
      const diy: string[] = [];
      const hired: string[] = [];
      const trades: [RegExp, string][] = [
        [/demo/, "demo"],
        [/plumb/, "plumbing"],
        [/tile/, "tile"],
        [/paint/, "paint"],
        [/drywall/, "drywall"],
        [/electric/, "electrical"],
        [/carpent|frame/, "carpentry"],
        [/hvac|duct|vent/, "hvac"],
        [/roof/, "roofing"],
      ];
      for (const [re, key] of trades) {
        if (re.test(s)) {
          const idx = s.search(re);
          const win = s.slice(Math.max(0, idx - 20), idx + 25);
          if (/hir|pay|contractor|guy|pro|have someone/.test(win))
            hired.push(key);
          else diy.push(key);
        }
      }
      const patch: Record<string, unknown> = {};
      if (diy.length > 0) patch.diy_scope = diy;
      if (hired.length > 0) patch.hired_scope = hired;
      return patch;
    },
  },

  {
    id: "permits",
    priority: 34,
    appliesWhen: (intake) =>
      intake.category === "renovation" || intake.category === "outdoor",
    isAnswered: (intake) => intake.skip_permits !== undefined,
    ask: () =>
      `Permits — pulling them, or skipping? (Either's fine. Skipping just means no paper trail at resale.)`,
    capture: (reply) => {
      const s = lower(reply);
      if (/skip|no perm|without|no way/.test(s)) return { skip_permits: true };
      if (/pull|get|yes perm|permit.*yes|above board/.test(s))
        return { skip_permits: false };
      const yn = parseYesNo(reply);
      return yn === null ? {} : { skip_permits: !yn };
    },
    recap: (intake) => {
      const diy = (intake.diy_scope as string[] | undefined)?.join(", ");
      const hired = (intake.hired_scope as string[] | undefined)?.join(", ");
      return `DIY: ${diy || "most of it"}${hired ? ` · hired: ${hired}` : ""} · ${intake.skip_permits === true ? "no permits" : "permits on"}.`;
    },
  },

  // ──── Maker branch — furniture/craft ─────

  {
    id: "materials",
    priority: 50,
    appliesWhen: (intake) =>
      intake.category === "furniture" ||
      intake.category === "craft" ||
      intake.category === "decor",
    isAnswered: (intake) => !!specificsGet(intake, "materials"),
    ask: (name, intake) =>
      intake.category === "furniture"
        ? `What material — pine, oak, walnut, plywood, metal? And any finish in mind (stain, paint, oil)?`
        : `What are the main materials? (If you don't know yet, that's fine — rough it in.)`,
    capture: (reply, intake) => {
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      specifics.materials = reply.trim();
      return { specifics };
    },
  },

  {
    id: "tools_available",
    priority: 51,
    appliesWhen: (intake) =>
      intake.category === "furniture" || intake.category === "craft",
    isAnswered: (intake) => !!specificsGet(intake, "tools_available"),
    ask: () =>
      `What tools do you already have that matter for this? (Miter saw, drill, sewing machine, wheel, whatever.)`,
    capture: (reply, intake) => {
      const specifics = { ...((intake.specifics as Record<string, unknown>) || {}) };
      specifics.tools_available = reply.trim();
      return { specifics };
    },
  },

  // ──── Universal (help, weekends, skill, budget, timeline) — lower priority
  //       so they come after category-specifics

  {
    id: "help",
    priority: 25,
    appliesWhen: () => true,
    isAnswered: (intake) => !!intake.help,
    ask: () => `How are you working on this — solo, with a partner, a friend?`,
    capture: (reply) => {
      const s = lower(reply);
      if (/solo|alone|myself|just me/.test(s)) return { help: "solo" };
      if (/partner|spouse|husband|wife|girlfriend|boyfriend/.test(s))
        return { help: "partner" };
      if (/friend|buddy|neighbor/.test(s)) return { help: "friend" };
      if (/multiple|crew|team/.test(s)) return { help: "multiple" };
      return { help: reply.trim() };
    },
  },

  {
    id: "weekends",
    priority: 26,
    appliesWhen: () => true,
    isAnswered: (intake) => intake.weekends_available !== undefined,
    ask: () =>
      `Realistically, how many weekends (or equivalent days) can you give this?`,
    capture: (reply) => {
      const n = parseNumber(reply);
      if (n && n > 0 && n < 200) return { weekends_available: n };
      return {};
    },
  },

  {
    id: "skill",
    priority: 27,
    appliesWhen: () => true,
    isAnswered: (intake) => intake.skill_comfort !== undefined,
    ask: () =>
      `On a 1–5 scale, how comfortable are you with tools + a home center? (1 = never held a drill, 5 = framed a shed.)`,
    capture: (reply) => {
      const m = reply.match(/\b([1-5])\b/);
      return m ? { skill_comfort: parseInt(m[1], 10) } : {};
    },
  },

  {
    id: "budget",
    priority: 28,
    appliesWhen: () => true,
    isAnswered: (intake) => intake.budget_total !== undefined,
    ask: () => `What's your budget ceiling? A rough dollar figure is fine.`,
    capture: (reply) => {
      const m = reply.match(/\$?\s*([\d,]{2,})/);
      if (m) {
        const n = parseInt(m[1].replace(/,/g, ""), 10);
        if (n >= 20) return { budget_total: n };
      }
      return {};
    },
  },

  {
    id: "timeline",
    priority: 60,
    appliesWhen: () => true,
    isAnswered: (intake) => !!intake.timeline_pressure,
    ask: () =>
      `Any timeline pressure? A date you want to be done by, or nothing firm?`,
    capture: (reply) => (reply.trim() ? { timeline_pressure: reply.trim() } : {}),
    recap: (intake) => {
      const parts: string[] = [];
      if (intake.project_goal) parts.push(`"${intake.project_goal as string}"`);
      const loc = intake.location as Record<string, string> | undefined;
      if (loc?.city || loc?.county) parts.push(loc.city || loc.county);
      const diy = intake.diy_scope as string[] | undefined;
      if (diy?.length) parts.push(`DIY: ${diy.join(", ")}`);
      const hired = intake.hired_scope as string[] | undefined;
      if (hired?.length) parts.push(`hired: ${hired.join(", ")}`);
      if (intake.skip_permits === true) parts.push("no permits");
      return parts.length > 0 ? `Recap: ${parts.join(" · ")}. Ready to draft.` : null;
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Controller

/** Merge a patch into intake, deep-merging specifics + location. */
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

/**
 * Pick the next card to ask. Null if nothing left → intake complete.
 */
function nextCard(intake: Record<string, unknown>): QCard | null {
  const applicable = CARDS.filter(
    (c) => c.appliesWhen(intake) && !c.isAnswered(intake)
  );
  if (applicable.length === 0) return null;
  applicable.sort((a, b) => a.priority - b.priority);
  return applicable[0];
}

/** The AI-facing fn. On every call, figure out where we are and respond. */
export function runMockIntake(input: MockIntakeInput): MockIntakeOutput {
  const { projectName, userTurns, intakeSoFar } = input;

  // Find which card asked the LAST assistant turn — that's the one we'll
  // capture against. The simplest proxy: whichever card would have been next
  // given the previous intake state. But since we don't persist history, we
  // infer by running the controller on the LATEST intake minus the latest
  // turn's changes. Good enough for a mock.

  const latestReply = userTurns[userTurns.length - 1] ?? "";

  // If a reply exists, run ALL cards' captures and accept any that produce
  // patches. This is more forgiving than tracking which specific card fired.
  let patch: Record<string, unknown> = {};
  if (userTurns.length > 0) {
    // Walk cards in priority order; the first unanswered applicable card that
    // produces a non-empty patch wins. Fallback: any card that matches.
    const candidates = CARDS.filter((c) => c.appliesWhen(intakeSoFar));
    candidates.sort((a, b) => a.priority - b.priority);
    for (const c of candidates) {
      if (c.isAnswered(intakeSoFar)) continue;
      const p = c.capture(latestReply, intakeSoFar);
      if (p && Object.keys(p).length > 0) {
        patch = p;
        break;
      }
    }
  }

  const merged = mergeIntake(intakeSoFar, patch);

  // What's the next card?
  const next = nextCard(merged);

  // Count answered cards across the whole deck that are applicable now.
  const applicable = CARDS.filter((c) => c.appliesWhen(merged));
  const answered = applicable.filter((c) => c.isAnswered(merged)).length;
  const estTotal = applicable.length;

  if (!next) {
    const wrap =
      CARDS.find((c) => c.id === "timeline")?.recap?.(merged) ??
      "I've got what I need. Ready to draft.";
    return {
      reply: "Hit Draft my plan when you're ready.",
      intake_patch: patch,
      progress: {
        captured_count: estTotal,
        estimated_total: estTotal,
        recap: wrap,
      },
      is_complete: true,
      detected_sub_projects: detectSubProjects(latestReply),
    };
  }

  // Fire the recap associated with the card we JUST answered (look back one)
  const prev = CARDS.filter((c) => c.appliesWhen(intakeSoFar))
    .filter((c) => c.isAnswered(merged) && !c.isAnswered(intakeSoFar))
    .sort((a, b) => a.priority - b.priority)
    .pop();
  const recap = prev?.recap?.(merged) ?? null;

  return {
    reply: next.ask(projectName, merged),
    intake_patch: patch,
    progress: {
      captured_count: answered,
      estimated_total: estTotal,
      recap,
    },
    is_complete: false,
    detected_sub_projects: detectSubProjects(latestReply),
  };
}
