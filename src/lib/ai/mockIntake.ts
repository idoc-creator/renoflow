/**
 * Scripted mock of the intake conversation for local/offline testing.
 *
 * We advance through a canned sequence of 10 questions, captured by index
 * from the number of assistant messages already sent. We also do tiny keyword
 * detection on the user's replies so the captured intake feels real and
 * side-build detection (e.g. "vanity") works.
 */

export interface MockIntakeInput {
  projectName: string;
  userTurns: string[]; // in chronological order, only the USER messages
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

interface Step {
  ask: (name: string) => string;
  /** Given the user's latest reply (or "" if none yet), produce a patch. */
  capture: (
    reply: string,
    intake: Record<string, unknown>
  ) => Record<string, unknown>;
  recap?: (intake: Record<string, unknown>) => string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

const lower = (s: string) => s.toLowerCase();

function parseYesNo(reply: string): boolean | null {
  const s = lower(reply).trim();
  if (/^(yes|y|yeah|yep|yup|sure|of course)\b/.test(s)) return true;
  if (/^(no|n|nope|nah|not really)\b/.test(s)) return false;
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
  if (/bath(room)?|shower|tub|vanity|toilet/.test(s)) return "renovation";
  if (/kitchen/.test(s)) return "renovation";
  if (/deck|patio|garden|shed|fence/.test(s)) return "outdoor";
  if (/table|chair|dresser|shelf|shelves|bookcase|furniture/.test(s))
    return "furniture";
  if (/paint|decor|mirror/.test(s)) return "decor";
  if (/pottery|sew|knit|craft|jewelry|clay/.test(s)) return "craft";
  return null;
}

function detectSubProjects(
  reply: string
): { title: string; reason_it_came_up: string }[] {
  const s = lower(reply);
  const subs: { title: string; reason_it_came_up: string }[] = [];
  if (/\b(build|make|diy)\b.*\b(vanity|cabinet|shelves|shelf|bench|frame)\b/.test(s)) {
    const m = s.match(/\b(build|make|diy)\b.*\b(vanity|cabinet|shelves|shelf|bench|frame)\b/);
    if (m) {
      const verb = m[1];
      const noun = m[2];
      subs.push({
        title: `${verb[0].toUpperCase()}${verb.slice(1)} the ${noun}`,
        reason_it_came_up: `You mentioned wanting to ${verb} your own ${noun}.`,
      });
    }
  }
  return subs;
}

// ─────────────────────────────────────────────────────────────────────────────
// The scripted flow

const STEPS: Step[] = [
  // 0 — Opener (no prior reply).
  {
    ask: (name) =>
      `Hey! I'll help you shape up a plan for ${name}. Before I start drafting anything, I want to get a feel for the project. In your own words — what are you doing, and why?`,
    capture: (reply) => {
      const patch: Record<string, unknown> = {};
      if (reply.trim()) patch.project_goal = reply.trim();
      const cat = detectCategory(reply);
      if (cat) patch.category = cat;
      if (/save money|saving money|save \$|cheap/.test(lower(reply))) {
        patch.primary_motivation = "save money";
      } else if (/learn|skill/.test(lower(reply))) {
        patch.primary_motivation = "learn skills";
      }
      return patch;
    },
  },

  // 1 — Location (most projects) or materials (craft)
  {
    ask: () =>
      `Got it. Where are you doing this — roughly, city and state? (Permits and code vary a lot by jurisdiction, so this matters more than you'd think.)`,
    capture: (reply) => {
      const s = reply.trim();
      const patch: Record<string, unknown> = {};
      // Look for state abbreviation
      const stateMatch = s.match(/\b([A-Z]{2})\b/);
      const location: Record<string, unknown> = {};
      if (stateMatch) location.state = stateMatch[1];
      // Look for known Oregon counties or a comma-separated "City, ST"
      if (/clackamas/i.test(s)) location.county = "Clackamas";
      if (/multnomah/i.test(s)) location.county = "Multnomah";
      if (/washington county/i.test(s)) location.county = "Washington";
      const cityMatch = s.match(/^([A-Z][a-zA-Z ]+?)(?:,|\s+[A-Z]{2})/);
      if (cityMatch) location.city = cityMatch[1].trim();
      else if (s && !stateMatch) location.city = s;
      if (Object.keys(location).length > 0) patch.location = location;
      return patch;
    },
  },

  // 2 — Primary residence
  {
    ask: () =>
      `Is this your own home that you live in full-time? (In some states that unlocks homeowner permits you can pull yourself.)`,
    capture: (reply) => {
      const yn = parseYesNo(reply);
      return yn === null ? {} : { is_primary_residence: yn };
    },
  },

  // 3 — Year built / era
  {
    ask: () =>
      `How old is the house, roughly? Year built if you know it, or just "old" / "newer" — pre-1980 opens a whole can of worms around lead and asbestos that we should plan for.`,
    capture: (reply) => {
      const n = parseNumber(reply);
      if (n && n > 1800 && n < 2100) return { year_built: n };
      if (/old|vintage|craftsman|1920|1930|1940/.test(lower(reply))) {
        return { year_built: 1935 };
      }
      return {};
    },
    recap: (intake) => {
      const loc = intake.location as Record<string, string> | undefined;
      const city = loc?.city || loc?.county || "your area";
      const goal = (intake.project_goal as string) || "your project";
      return `So far I've got: "${goal}" in ${city}${intake.is_primary_residence === true ? ", your own place" : ""}. Getting closer — let's get into the nitty-gritty.`;
    },
  },

  // 4 — Specifics for bathrooms (or fallback)
  {
    ask: () =>
      `A few specifics: are you keeping the tub or replacing it? And what are the walls behind it — drywall, tile, lath & plaster? (If you're not doing a bathroom, just tell me what the key decisions are for your build.)`,
    capture: (reply) => {
      const s = lower(reply);
      const specifics: Record<string, unknown> = {};
      if (/keep.*tub|leave.*tub|existing tub/.test(s)) specifics.keep_tub = true;
      if (/replace.*tub|new tub/.test(s)) specifics.keep_tub = false;
      if (/lath.*plaster|plaster/.test(s)) specifics.walls_type = "lath_plaster";
      else if (/drywall|sheetrock/.test(s)) specifics.walls_type = "drywall";
      else if (/tile/.test(s)) specifics.walls_type = "tile";
      if (/layout|move|relocat/.test(s)) specifics.layout_change = true;
      if (/one bath|only bath|single bath/.test(s))
        specifics.has_backup_bathroom = false;
      if (/another bath|second bath|backup/.test(s))
        specifics.has_backup_bathroom = true;
      return Object.keys(specifics).length > 0
        ? { specifics }
        : {};
    },
  },

  // 5 — DIY scope vs hired
  {
    ask: () =>
      `What parts are you doing yourself vs hiring out? (e.g. "demo + plumbing + tile DIY, hiring an electrician" — or whatever the split is.) Be honest with yourself.`,
    capture: (reply) => {
      const s = lower(reply);
      const diy: string[] = [];
      const hired: string[] = [];
      const tradeMap: [RegExp, string][] = [
        [/demo/, "demo"],
        [/plumb/, "plumbing"],
        [/tile/, "tile"],
        [/paint/, "paint"],
        [/drywall/, "drywall"],
        [/electric/, "electrical"],
        [/carpent|frame/, "carpentry"],
      ];
      for (const [re, key] of tradeMap) {
        if (re.test(s)) {
          // Very loose: if the word appears near "hire|hiring|pay", put in hired.
          const window = s.slice(Math.max(0, s.search(re) - 15), s.search(re) + 20);
          if (/hir|pay|contractor|guy/.test(window)) hired.push(key);
          else diy.push(key);
        }
      }
      const patch: Record<string, unknown> = {};
      if (diy.length > 0) patch.diy_scope = diy;
      if (hired.length > 0) patch.hired_scope = hired;
      return patch;
    },
  },

  // 6 — Permits
  {
    ask: () =>
      `Permits — do you want to pull them and do this above-board, or skip? (Either's fine. Skipping just means the paper trail is missing at resale — you tell me.)`,
    capture: (reply) => {
      const yn = parseYesNo(reply);
      const s = lower(reply);
      if (/skip|no perm|without perm/.test(s)) return { skip_permits: true };
      if (/pull|get perm|yes|permit/.test(s) && yn !== false)
        return { skip_permits: false };
      return yn === null ? {} : { skip_permits: !yn };
    },
    recap: (intake) => {
      const diy = (intake.diy_scope as string[] | undefined)?.join(", ");
      const hired = (intake.hired_scope as string[] | undefined)?.join(", ");
      return `So: you're DIY on ${diy || "most of it"}${hired ? `, hiring out ${hired}` : ""}${intake.skip_permits === true ? ", skipping permits" : ", permits are on the table"}. Noted.`;
    },
  },

  // 7 — Help + weekends
  {
    ask: () =>
      `How are you working on this — solo, with a partner, a friend who shows up for a few weekends? And realistically, how many weekends can you give this?`,
    capture: (reply) => {
      const s = lower(reply);
      const patch: Record<string, unknown> = {};
      if (/solo|alone|by myself|just me/.test(s)) patch.help = "solo";
      else if (/partner|spouse|husband|wife|boyfriend|girlfriend/.test(s))
        patch.help = "partner";
      else if (/friend|buddy/.test(s)) patch.help = "friend";
      const n = parseNumber(reply);
      if (n && n > 0 && n < 60) patch.weekends_available = n;
      return patch;
    },
  },

  // 8 — Skill + budget
  {
    ask: () =>
      `Two quick ones. On a 1–5 scale, how comfortable are you with tools and a home center (1 = never held a drill, 5 = I've framed a shed)? And what's your total budget ceiling?`,
    capture: (reply) => {
      const patch: Record<string, unknown> = {};
      // Look for a 1-5 first
      const skill = reply.match(/\b([1-5])\b/);
      if (skill) patch.skill_comfort = parseInt(skill[1], 10);
      // Look for a dollar amount (usually 3+ digits)
      const money = reply.match(/\$?\s*([\d,]{3,})/);
      if (money) {
        const n = parseInt(money[1].replace(/,/g, ""), 10);
        if (n >= 100) patch.budget_total = n;
      }
      return patch;
    },
  },

  // 9 — Timeline + wrap
  {
    ask: () =>
      `Last one — any timeline pressure? A date you want to be done by, or nothing firm?`,
    capture: (reply) => {
      return reply.trim() ? { timeline_pressure: reply.trim() } : {};
    },
    recap: (intake) => {
      const parts: string[] = [];
      if (intake.project_goal)
        parts.push(`"${intake.project_goal as string}"`);
      const loc = intake.location as Record<string, string> | undefined;
      if (loc?.city || loc?.county) parts.push(loc.city || loc.county);
      const diy = intake.diy_scope as string[] | undefined;
      if (diy?.length) parts.push(`DIY: ${diy.join(", ")}`);
      const hired = intake.hired_scope as string[] | undefined;
      if (hired?.length) parts.push(`hired: ${hired.join(", ")}`);
      if (intake.skip_permits === true) parts.push("no permits");
      return `Recap: ${parts.join(" · ")}. That's enough to draft you a real plan.`;
    },
  },
];

const ESTIMATED_TOTAL = STEPS.length;

export function runMockIntake(input: MockIntakeInput): MockIntakeOutput {
  const { projectName, userTurns, intakeSoFar } = input;

  // Current step index = number of user turns we've already processed.
  // On the very first call (no user turns), index = 0 → opener.
  const stepIndex = Math.min(userTurns.length, STEPS.length - 1);
  const latestReply = userTurns[userTurns.length - 1] ?? "";

  // Capture patch from the LATEST reply, using the step that asked it
  // (i.e. the previous step). On the opener call, there's nothing to capture.
  let patch: Record<string, unknown> = {};
  if (userTurns.length > 0) {
    const askingStep = STEPS[userTurns.length - 1];
    if (askingStep) patch = askingStep.capture(latestReply, intakeSoFar);
  }

  // Merged view for recap logic below
  const mergedForRecap = {
    ...intakeSoFar,
    ...patch,
    specifics: {
      ...((intakeSoFar.specifics as Record<string, unknown>) || {}),
      ...((patch.specifics as Record<string, unknown>) || {}),
    },
    location: {
      ...((intakeSoFar.location as Record<string, unknown>) || {}),
      ...((patch.location as Record<string, unknown>) || {}),
    },
  };

  // Determine whether we're wrapping up.
  const isComplete = userTurns.length >= STEPS.length;

  if (isComplete) {
    const wrap =
      STEPS[STEPS.length - 1].recap?.(mergedForRecap) ??
      "That's plenty — I've got what I need.";
    return {
      reply: `${wrap}\n\nHit **Draft my plan** whenever you're ready.`,
      intake_patch: patch,
      progress: {
        captured_count: ESTIMATED_TOTAL,
        estimated_total: ESTIMATED_TOTAL,
        recap: wrap,
      },
      is_complete: true,
      detected_sub_projects: detectSubProjects(latestReply),
    };
  }

  const step = STEPS[stepIndex];
  const recap = step.recap?.(mergedForRecap) ?? null;

  return {
    reply: recap ? `${recap}\n\n${step.ask(projectName)}` : step.ask(projectName),
    intake_patch: patch,
    progress: {
      captured_count: userTurns.length,
      estimated_total: ESTIMATED_TOTAL,
      recap,
    },
    is_complete: false,
    detected_sub_projects: detectSubProjects(latestReply),
  };
}
