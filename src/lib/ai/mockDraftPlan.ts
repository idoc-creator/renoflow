/**
 * Scripted mock plan generator. Reads the intake and produces a believable
 * plan + milestones without calling any AI service.
 *
 * Not exhaustive — we aim for a "feels real" bathroom gut by default, and
 * soften for crafts/furniture when the category says so.
 */

interface Step {
  title: string;
  description: string;
  skill_level: "beginner" | "intermediate" | "advanced" | "hire_out";
  estimated_minutes: number;
  tools_needed: string[];
}

interface Stage {
  title: string;
  description: string;
  reason: string;
  estimated_cost: number;
  estimated_hours: number;
  steps: Step[];
}

interface Milestone {
  title: string;
  kind: "permit" | "inspection" | "delivery" | "other";
  notes: string;
  blocks_stage_index: number | null;
}

export interface MockPlanOutput {
  stages: Stage[];
  suggested_milestones: Milestone[];
}

export function runMockDraftPlan(
  projectName: string,
  intake: Record<string, unknown>
): MockPlanOutput {
  const category = (intake.category as string) || "renovation";
  const skipPermits = intake.skip_permits === true;
  const hired = (intake.hired_scope as string[] | undefined) ?? [];
  const diy = (intake.diy_scope as string[] | undefined) ?? [];
  const specifics =
    (intake.specifics as Record<string, unknown> | undefined) ?? {};
  const wallsType = specifics.walls_type as string | undefined;
  const keepTub = specifics.keep_tub === true;
  const yearBuilt = intake.year_built as number | undefined;
  const isOldHouse = typeof yearBuilt === "number" && yearBuilt < 1980;
  const electricalHired = hired.includes("electrical");

  if (category === "furniture") {
    return buildFurniturePlan(projectName, intake);
  }
  if (category === "craft") {
    return buildCraftPlan(projectName);
  }
  if (category === "decor") {
    return buildDecorPlan(projectName);
  }
  if (category === "outdoor") {
    return buildOutdoorPlan(projectName);
  }

  // Renovation — if not a bathroom, we still need a reasonable default
  const renoType = (specifics as Record<string, unknown>).reno_type as
    | string
    | undefined;
  if (renoType && renoType !== "bathroom" && renoType !== "kitchen") {
    return buildGenericRenoPlan(projectName, renoType, intake);
  }

  // Bathroom-ish plan.
  const stages: Stage[] = [];

  // Stage 1 — Test + Protect (shows up when house is old or walls are lath)
  if (isOldHouse || wallsType === "lath_plaster") {
    stages.push({
      title: "Test & protect",
      description:
        "Before you swing a hammer, find out what's in the walls and wrap anything you're keeping.",
      reason:
        "Old houses almost always have lead paint and sometimes asbestos in plaster patches, mastic, or pipe wrap. Testing is $200–$400 and protects the tub + your HVAC from plaster dust that gets everywhere.",
      estimated_cost: 300,
      estimated_hours: 6,
      steps: [
        {
          title: "Order asbestos + lead test kits",
          description:
            "DIY kits from Home Depot or a certified lab. Sample any patched plaster, pipe insulation, and tile mastic.",
          skill_level: "beginner",
          estimated_minutes: 30,
          tools_needed: ["N95 or P100 respirator", "gallon ziplocs"],
        },
        {
          title: "Protect the tub",
          description:
            "Plywood bottom + ram board sides + taped plastic top. Plaster dust scratches porcelain instantly.",
          skill_level: "beginner",
          estimated_minutes: 45,
          tools_needed: ["utility knife", "tape", "ram board"],
        },
        {
          title: "Seal HVAC returns + doorway",
          description:
            "Tape plastic over any register in the bathroom, and rig a zip wall at the door. Tile + plaster dust will coat the whole house otherwise.",
          skill_level: "beginner",
          estimated_minutes: 45,
          tools_needed: ["plastic sheeting", "painter's tape", "ZipWall kit"],
        },
      ],
    });
  }

  // Stage 2 — Demo
  stages.push({
    title: "Demo",
    description:
      "Strip the bathroom to studs and subfloor. Keep the tub protected.",
    reason:
      "Demo first exposes whatever surprises are hiding — rotted subfloor around the toilet flange is nearly universal in old houses. Budget an extra weekend for repairs you won't know about until now.",
    estimated_cost: 450,
    estimated_hours: 16,
    steps: [
      {
        title: "Shut off water + cap supply lines",
        description:
          "Shutoffs at the fixtures, or main if the fixture stops are crusty. Cap with SharkBite fittings for peace of mind.",
        skill_level: "beginner",
        estimated_minutes: 45,
        tools_needed: ["channel locks", "SharkBite caps"],
      },
      {
        title: "Pull the toilet + vanity",
        description:
          "Sponge the toilet dry, disconnect, lift straight up. Vanity: cut caulk line, disconnect P-trap, pull forward.",
        skill_level: "beginner",
        estimated_minutes: 60,
        tools_needed: [
          "adjustable wrench",
          "sponge + bucket",
          "utility knife",
        ],
      },
      {
        title: "Score + remove lath & plaster",
        description:
          wallsType === "lath_plaster"
            ? "Score a grid with a utility knife, pry plaster off in sheets, then pry lath strips at the nail line. Wear P100."
            : "Pry drywall off in sheets, pull nails. Dust control still matters.",
        skill_level: "intermediate",
        estimated_minutes: 240,
        tools_needed: ["flat bar", "hammer", "P100 respirator", "eye protection"],
      },
      {
        title: "Inspect subfloor + framing",
        description:
          "Probe the subfloor with a screwdriver around the toilet flange and tub. Soft = rotted = patch before rough-in.",
        skill_level: "beginner",
        estimated_minutes: 30,
        tools_needed: ["flashlight", "screwdriver"],
      },
    ],
  });

  // Stage 3 — Plumbing rough-in (DIY if in diy_scope)
  const plumbingHired = hired.includes("plumbing");
  stages.push({
    title: plumbingHired ? "Plumbing rough-in (hired)" : "Plumbing rough-in",
    description: plumbingHired
      ? "Coordinate with your plumber and get the valve + drain locations marked before they arrive."
      : "Replace the shower valve, dial in drain locations, set supply stubs.",
    reason:
      "Plumbing goes before electrical because drains have tight slope tolerances and need the best real estate between studs. A modern pressure-balance valve is required by code and is the whole reason you're opening the back wall.",
    estimated_cost: plumbingHired ? 1600 : 350,
    estimated_hours: plumbingHired ? 4 : 14,
    steps: plumbingHired
      ? [
          {
            title: "Mark fixture locations on studs",
            description:
              "Sharpie the centerlines for tub spout, shower head, valve, vanity faucet, and toilet flange. Send photos to your plumber.",
            skill_level: "beginner",
            estimated_minutes: 60,
            tools_needed: ["tape measure", "sharpie"],
          },
          {
            title: "Confirm valve height with plumber",
            description:
              "Pressure-balance valves have max/min finished-wall depth. Get this right or you'll tile it in wrong.",
            skill_level: "beginner",
            estimated_minutes: 30,
            tools_needed: [],
          },
        ]
      : [
          {
            title: "Install new pressure-balance shower valve",
            description:
              "Anti-scald valves are required. Set the finished-wall depth using the plaster guard that comes in the box.",
            skill_level: "intermediate",
            estimated_minutes: 120,
            tools_needed: ["PEX crimper", "tubing cutter", "level", "stud finder"],
          },
          {
            title: "Rough in tub/shower supply + drain",
            description:
              keepTub
                ? "Keep existing tub drain if it's good; replace trip-lever if corroded. Tie new supply to valve."
                : "Drain + supply to new tub location.",
            skill_level: "intermediate",
            estimated_minutes: 180,
            tools_needed: ["PEX", "P-trap", "ABS cement", "saw"],
          },
          {
            title: "Rough in vanity + toilet",
            description:
              "Supply stubs at vanity, flange reset to finished-floor height (remember to add for tile + backer).",
            skill_level: "intermediate",
            estimated_minutes: 120,
            tools_needed: ["PEX", "flange spacer ring", "wax ring"],
          },
        ],
  });

  // Stage 4 — Electrical rough-in (coordination if hired)
  stages.push({
    title: electricalHired ? "Electrical rough-in (hired)" : "Electrical rough-in",
    description: electricalHired
      ? "Mark locations for your electrician and schedule the visit."
      : "GFCI outlet, AFCI-protected lighting, fan circuit, switch layout.",
    reason: electricalHired
      ? "You're hiring this out — your job is to make the electrician efficient. Marked locations + accessible panel = a faster (cheaper) visit."
      : `A bathroom needs a dedicated 20A GFCI for the receptacle(s) and the fan needs its own switch. ${intake.is_primary_residence === true ? "Oregon homeowner electrical permits require you do the work yourself and sign an affidavit at intake — no helpers." : ""}`,
    estimated_cost: electricalHired ? 1200 : 220,
    estimated_hours: electricalHired ? 3 : 10,
    steps: electricalHired
      ? [
          {
            title: "Mark box locations",
            description:
              "Vanity light at 78\" center, sconces at 66\" if any, switches inside door, GFCI 42\" above finished floor.",
            skill_level: "beginner",
            estimated_minutes: 45,
            tools_needed: ["tape measure", "stud finder", "pencil"],
          },
          {
            title: "Verify panel has a free breaker slot",
            description:
              "Open the panel cover and count open slots. If full, the electrician's quote just went up.",
            skill_level: "beginner",
            estimated_minutes: 15,
            tools_needed: ["flashlight"],
          },
          {
            title: "Book the rough-in visit",
            description:
              "Coordinate so their visit lines up with before you close walls.",
            skill_level: "beginner",
            estimated_minutes: 15,
            tools_needed: [],
          },
        ]
      : [
          {
            title: "Run dedicated 20A circuit to GFCI",
            description:
              "Home run from panel on 12/2. Don't tap an existing loaded circuit.",
            skill_level: "advanced",
            estimated_minutes: 180,
            tools_needed: ["fish tape", "wire stripper", "drill + bits"],
          },
          {
            title: "Wire fan + lighting circuit",
            description:
              "Fan on its own switch. Lighting can share a non-bath circuit. AFCI breaker.",
            skill_level: "advanced",
            estimated_minutes: 150,
            tools_needed: ["wire nuts", "stripper"],
          },
          {
            title: "Install boxes, pull wires, leave unconnected",
            description: "Inspector wants to see boxes set and wires pulled — not yet connected to devices.",
            skill_level: "advanced",
            estimated_minutes: 90,
            tools_needed: ["screwdriver", "lineman's pliers"],
          },
        ],
  });

  const preCloseStageIndex = stages.length; // next stage index (close walls)

  // Stage 5 — Close walls
  stages.push({
    title: "Insulate, block, close walls",
    description:
      "After rough-in inspections pass, pack insulation, add blocking for grab bars/vanity/towel bars, then cement board + green board.",
    reason:
      "This is the point of no return — once walls close, you can't fix rough-in mistakes without tearing it out. Add MORE blocking than you think you need.",
    estimated_cost: 320,
    estimated_hours: 12,
    steps: [
      {
        title: "Insulate exterior walls",
        description: "R-15 batts on any exterior wall. Oregon code.",
        skill_level: "beginner",
        estimated_minutes: 90,
        tools_needed: ["utility knife", "gloves"],
      },
      {
        title: "Add 2x blocking",
        description:
          "Future grab bars (at seated + standing heights), floating vanity, towel bars, shower bench if any.",
        skill_level: "beginner",
        estimated_minutes: 120,
        tools_needed: ["2x6 lumber", "drill", "3\" screws"],
      },
      {
        title: "Hang cement board on wet walls, green board elsewhere",
        description:
          "Tub surround: cement board with 1/4\" gap to tub flange. Tape + thinset joints.",
        skill_level: "intermediate",
        estimated_minutes: 240,
        tools_needed: ["rotary cutter", "screws", "thinset", "mesh tape"],
      },
    ],
  });

  // Stage 6 — Waterproof + Tile
  stages.push({
    title: "Waterproof + tile",
    description:
      "Liquid waterproofing or Kerdi membrane, then tile the floor and tub surround.",
    reason:
      "Waterproofing is its own stage — not an afterthought. Getting this wrong = mold in the walls in 2 years.",
    estimated_cost: 900,
    estimated_hours: 22,
    steps: [
      {
        title: "Apply waterproofing membrane",
        description:
          "RedGard (roll-on) is beginner-friendly. Two coats, pinhole-free, especially at inside corners.",
        skill_level: "intermediate",
        estimated_minutes: 180,
        tools_needed: ["roller", "brush", "RedGard bucket"],
      },
      {
        title: "Dry-fit tile layout",
        description:
          "Center focal wall on grout line, not a sliver. Plan niche around the grout grid.",
        skill_level: "beginner",
        estimated_minutes: 90,
        tools_needed: ["tile spacers", "chalk line"],
      },
      {
        title: "Tile floor + surround",
        description:
          "Floor first, then walls up from finished floor line. Use thinset + spacers + level constantly.",
        skill_level: "intermediate",
        estimated_minutes: 720,
        tools_needed: ["wet saw", "trowel", "float", "sponges"],
      },
      {
        title: "Grout + caulk plane changes",
        description:
          "Grout with a 45° float stroke. Silicone (NOT grout) at every corner — floor-to-wall, wall-to-wall, tub-to-tile.",
        skill_level: "intermediate",
        estimated_minutes: 240,
        tools_needed: ["grout float", "sponges", "silicone gun"],
      },
    ],
  });

  // Stage 7 — Fixtures + Finish
  stages.push({
    title: "Fixtures + finish",
    description:
      "Set the toilet, install the vanity, trim out valve + shower head, hang lights, install fan, paint.",
    reason:
      "Finish work is forgiving on timing but not on sequence. Paint last so you don't scuff fresh walls while installing everything else.",
    estimated_cost: 1400,
    estimated_hours: 14,
    steps: [
      {
        title: "Install vanity + faucet",
        description: "Shim level, caulk to wall, connect supply + P-trap.",
        skill_level: "beginner",
        estimated_minutes: 120,
        tools_needed: ["level", "shims", "silicone"],
      },
      {
        title: "Set toilet",
        description:
          "New wax ring, set straight down, don't twist, tighten bolts alternately until snug (not cranked).",
        skill_level: "beginner",
        estimated_minutes: 60,
        tools_needed: ["wax ring", "adjustable wrench"],
      },
      {
        title: "Install fan + lights + trim valve",
        description:
          "Fan duct to outside (not attic). Vanity + sconce lights. Shower valve trim kit over the rough valve.",
        skill_level: "intermediate",
        estimated_minutes: 180,
        tools_needed: ["screwdriver", "drill"],
      },
      {
        title: "Paint + touch-ups",
        description: "Bathroom-grade paint (mildew-resistant).",
        skill_level: "beginner",
        estimated_minutes: 180,
        tools_needed: ["rollers", "brushes", "painter's tape"],
      },
    ],
  });

  // Milestones (skip if user opted out)
  const milestones: Milestone[] = [];
  if (!skipPermits) {
    milestones.push(
      {
        title: "Pull plumbing permit",
        kind: "permit",
        notes:
          "Apply via Oregon ePermitting (buildingpermits.oregon.gov). Homeowner permits available for your primary residence.",
        blocks_stage_index: 2,
      },
      {
        title: electricalHired
          ? "Electrician pulls electrical permit"
          : "Pull electrical permit (homeowner)",
        kind: "permit",
        notes: electricalHired
          ? "Your electrician pulls this. Confirm they've done it before scheduling rough-in."
          : "Oregon homeowner electrical permit requires an affidavit signed at intake. You must do the work yourself.",
        blocks_stage_index: 3,
      },
      {
        title: "Plumbing rough-in inspection",
        kind: "inspection",
        notes:
          "Request by 7 AM via the state portal for next-day. Pressure test DWV at 5 PSI air for 15 min. MUST pass before closing walls.",
        blocks_stage_index: preCloseStageIndex,
      },
      {
        title: "Electrical rough-in inspection",
        kind: "inspection",
        notes:
          "Boxes set, wires pulled, not connected to devices. MUST pass before closing walls.",
        blocks_stage_index: preCloseStageIndex,
      },
      {
        title: "Final inspection (plumbing + electrical + building)",
        kind: "inspection",
        notes:
          "After fixtures installed. Legal to use the bathroom only once this passes.",
        blocks_stage_index: stages.length - 1,
      }
    );
  }

  // Long-lead deliveries — suggest regardless
  milestones.push({
    title: "Order tile, vanity, fan, fixtures",
    kind: "delivery",
    notes:
      "Tile and vanities commonly run 2–12 weeks. Order the big stuff BEFORE demo so it arrives in time for install.",
    blocks_stage_index: 5,
  });

  return { stages, suggested_milestones: milestones };
}

function buildFurniturePlan(
  projectName: string,
  intake: Record<string, unknown>
): MockPlanOutput {
  const specifics =
    (intake.specifics as Record<string, unknown> | undefined) ?? {};
  const materials = (specifics.materials as string) || "whatever wood fits";
  const designStatus =
    (specifics.design_status as string | undefined) || "designing";
  const isVanity = /vanity/i.test(projectName) || /vanity/i.test(
    (intake.project_goal as string) ?? ""
  );

  const designStage: Stage =
    designStatus === "has_plans"
      ? {
          title: "Review plans & confirm fit",
          description: `Verify your plans work for your space and match your hardware choices.`,
          reason:
            "You said you have plans already — this stage is quick: confirm dimensions fit where it'll live and make sure the hardware in the plan is available.",
          estimated_cost: 0,
          estimated_hours: 1,
          steps: [
            {
              title: "Measure the space",
              description: isVanity
                ? "Confirm plan dimensions fit the opening. Note plumbing rough-in locations."
                : "Confirm plan dimensions fit where the piece will live.",
              skill_level: "beginner",
              estimated_minutes: 30,
              tools_needed: ["tape measure"],
            },
            {
              title: "Check hardware + material availability",
              description:
                "Verify the specific hinges, slides, pulls, and wood in the plan are still available before ordering.",
              skill_level: "beginner",
              estimated_minutes: 30,
              tools_needed: [],
            },
          ],
        }
      : designStatus === "rough_idea"
      ? {
          title: "Shape the design",
          description: `Turn your rough idea for ${projectName} into a workable plan.`,
          reason:
            "Your idea needs to become dimensions and a cut list before you can source materials confidently.",
          estimated_cost: 20,
          estimated_hours: 2,
          steps: [
            {
              title: "Measure the space",
              description: isVanity
                ? "Width, depth, height of the opening. Leave ~1/4\" clearance each side. Note plumbing rough-in."
                : "Where will the piece live? Note floor irregularities, clearances.",
              skill_level: "beginner",
              estimated_minutes: 30,
              tools_needed: ["tape measure", "pencil"],
            },
            {
              title: "Reference pics + dimension sketch",
              description:
                "Find 3-5 reference pieces you like. Sketch front/side with every dimension. Pick joinery method.",
              skill_level: "beginner",
              estimated_minutes: 60,
              tools_needed: ["paper", "pencil"],
            },
            {
              title: "Cut list + shopping list",
              description: `Every piece: L × W × T × qty. Board-feet in ${materials}. Add 15-20% for mistakes.`,
              skill_level: "beginner",
              estimated_minutes: 30,
              tools_needed: [],
            },
          ],
        }
      : {
          title: "Design & measure",
          description: `Nail down dimensions, joinery choice, and hardware for ${projectName}.`,
          reason:
            "Paper (or SketchUp) is cheap. Wood is not. The sketch tells you exactly how many board-feet, how many fasteners, and what order to cut.",
          estimated_cost: 40,
          estimated_hours: 3,
          steps: [
            {
              title: "Measure the space",
              description: isVanity
                ? "Measure the opening where the vanity goes — width, depth, height. Leave ~1/4\" clearance on each side. Note plumbing rough-in locations."
                : "Measure where the piece will live. Note floor irregularities, clearances, outlets, trim.",
              skill_level: "beginner",
              estimated_minutes: 30,
              tools_needed: ["tape measure", "pencil", "painter's tape"],
            },
            {
              title: "Sketch + dimensioned drawing",
              description:
                "Front, side, top views with every dimension. Call out joinery (pocket screws, dominoes, dowels, dadoes). Pick hardware FIRST — drawer slides + hinges dictate case dimensions.",
              skill_level: "beginner",
              estimated_minutes: 90,
              tools_needed: ["graph paper", "ruler", "pencil"],
            },
            {
              title: "Cut list + shopping list",
              description: `Every piece: L × W × T × qty. Board-feet in ${materials}. Add 15-20% for mistakes.`,
              skill_level: "beginner",
              estimated_minutes: 45,
              tools_needed: [],
            },
          ],
        };

  return {
    stages: [
      designStage,
      {
        title: "Source materials",
        description: "Get the wood, hardware, and finish on hand before cutting.",
        reason:
          "Going back to the store mid-build kills momentum — and finish schedules (stain + seal drying) eat more days than the woodworking itself.",
        estimated_cost: 350,
        estimated_hours: 3,
        steps: [
          {
            title: "Buy lumber + sheet goods",
            description:
              "Hit a hardwood dealer or lumber yard. Hand-pick boards — look for flat, straight, minimal knots where they'll show.",
            skill_level: "beginner",
            estimated_minutes: 90,
            tools_needed: ["vehicle / rack", "straps"],
          },
          {
            title: "Buy hardware + finish",
            description: isVanity
              ? "Drawer slides, pulls, hinges, and any slab/sink mounting brackets. Pick your finish now (oil, water-based poly, shellac) — the look drives topcoat choice."
              : "Hinges, pulls, slides, fasteners, finish. Don't underestimate finish quantity.",
            skill_level: "beginner",
            estimated_minutes: 45,
            tools_needed: [],
          },
        ],
      },
      {
        title: "Mill & cut parts",
        description:
          "Rough-mill to size, then final-cut per the cut list. Label everything.",
        reason:
          "Accurate parts = easy assembly. The hour you spend squaring parts saves three hours of fighting gaps later.",
        estimated_cost: 0,
        estimated_hours: 6,
        steps: [
          {
            title: "Rough-cut lumber to workable lengths",
            description:
              "Crosscut boards a couple inches longer than final — stress in boards releases once cut, so rough-first, finish-second.",
            skill_level: "intermediate",
            estimated_minutes: 90,
            tools_needed: ["miter saw or circular saw", "stop block"],
          },
          {
            title: "Joint + plane to thickness",
            description:
              "If you have a jointer/planer, face-joint + edge-joint + thickness-plane each board. If not, buy S4S pre-milled — much costlier but beginner-friendly.",
            skill_level: "intermediate",
            estimated_minutes: 120,
            tools_needed: ["jointer", "planer"],
          },
          {
            title: "Final cuts per cut list",
            description:
              "Use a stop block for identical pieces. Label each part with a pencil mark — front, back, sides, top, shelves.",
            skill_level: "intermediate",
            estimated_minutes: 120,
            tools_needed: ["table saw or track saw", "square", "pencil"],
          },
        ],
      },
      {
        title: "Joinery",
        description: "Cut the joints that hold the piece together.",
        reason:
          "Joinery is where amateur builds fail. Pick ONE method you're comfortable with and repeat — don't mix five techniques on your first build.",
        estimated_cost: 20,
        estimated_hours: 5,
        steps: [
          {
            title: "Mark joinery locations",
            description:
              "Dry-assemble the case, mark where every joint goes with a pencil and square. Check that everything's square before a single cut.",
            skill_level: "intermediate",
            estimated_minutes: 60,
            tools_needed: ["combination square", "marking gauge"],
          },
          {
            title: "Cut the joints",
            description:
              "Pocket screws for beginners; dominoes or dowels if you have the jigs; hand-cut dadoes with a router. One method, used consistently.",
            skill_level: "intermediate",
            estimated_minutes: 180,
            tools_needed: ["pocket hole jig", "drill", "clamps"],
          },
        ],
      },
      {
        title: "Dry-fit & assemble",
        description: "Assemble without glue first. Then glue up.",
        reason:
          "Every build has surprises at glue-up. Catching a 1/8\" gap during the dry-fit costs nothing; catching it after the glue sets is brutal.",
        estimated_cost: 15,
        estimated_hours: 4,
        steps: [
          {
            title: "Dry-fit the whole piece",
            description:
              "Clamp it together with no glue. Check every joint, every diagonal (measure opposite corners — equal = square), every surface.",
            skill_level: "intermediate",
            estimated_minutes: 60,
            tools_needed: ["clamps", "tape measure"],
          },
          {
            title: "Glue up in stages",
            description:
              "Break the assembly into 2-3 sub-assemblies if it's complex. Open time matters — use slow-setting glue (30+ min open) for anything past a single panel.",
            skill_level: "intermediate",
            estimated_minutes: 120,
            tools_needed: ["wood glue", "clamps", "dead-blow mallet", "wet rag"],
          },
          {
            title: "Install drawers, doors, hardware",
            description:
              "Drawer slides first, then drawers. Door hinges, then pulls. Test every movement before declaring done.",
            skill_level: "intermediate",
            estimated_minutes: 120,
            tools_needed: ["drill", "bits", "level"],
          },
        ],
      },
      {
        title: "Sand & finish",
        description: "Progressive sanding, then stain/finish.",
        reason:
          "The finish makes or breaks the piece visually. Skipping grits leaves scratches that only show up after the first coat — when it's too late to fix easily.",
        estimated_cost: 60,
        estimated_hours: 6,
        steps: [
          {
            title: "Sand progressively",
            description:
              "80 → 120 → 180 → 220 grit. Don't skip. Each grit removes the scratches from the previous one. Vacuum + tack cloth between grits.",
            skill_level: "beginner",
            estimated_minutes: 150,
            tools_needed: ["random orbit sander", "sandpaper assortment", "tack cloth"],
          },
          {
            title: "Apply stain (if staining)",
            description:
              "Pre-conditioner on softwoods. Test on scrap. Wipe with the grain, wait 5 min, wipe off excess.",
            skill_level: "beginner",
            estimated_minutes: 90,
            tools_needed: ["foam brush", "rags"],
          },
          {
            title: "Apply topcoat — 3 coats minimum",
            description:
              "Polyurethane or water-based finish. Thin first coat, sand lightly between coats with 320 grit. Let each coat cure fully.",
            skill_level: "beginner",
            estimated_minutes: 180,
            tools_needed: ["brush or spray gun", "sandpaper"],
          },
        ],
      },
      ...(isVanity
        ? [
            {
              title: "Install in bathroom",
              description:
                "Set the vanity, hook up plumbing, attach top/sink.",
              reason:
                "If this is a sub-project of a bathroom remodel, time this AFTER tile is done and the finished-floor height is known.",
              estimated_cost: 100,
              estimated_hours: 3,
              steps: [
                {
                  title: "Position + level",
                  description:
                    "Dry-fit in the opening, shim until level in both axes, mark the wall for anchor screws into studs.",
                  skill_level: "intermediate",
                  estimated_minutes: 45,
                  tools_needed: ["level", "shims", "stud finder"],
                },
                {
                  title: "Hook up plumbing",
                  description:
                    "Shutoffs to angle stops → faucet supply lines. Drain: P-trap to waste line. Silicone around the drain flange.",
                  skill_level: "intermediate",
                  estimated_minutes: 60,
                  tools_needed: ["channel locks", "silicone"],
                },
                {
                  title: "Top, sink, caulk",
                  description:
                    "Set the top (if separate from cabinet), install the sink, caulk the perimeter to the wall.",
                  skill_level: "beginner",
                  estimated_minutes: 60,
                  tools_needed: ["caulk gun", "100% silicone"],
                },
              ],
            } as Stage,
          ]
        : []),
    ],
    suggested_milestones: [
      {
        title: "Materials arrive / sourced",
        kind: "delivery",
        notes:
          "Specialty hardwoods and matching hardware can run 2-4 weeks if you're not at a big box. Order early.",
        blocks_stage_index: 2,
      },
    ],
  };
}

function buildCraftPlan(projectName: string): MockPlanOutput {
  return {
    stages: [
      {
        title: "Design",
        description: `Sketch out what you want ${projectName} to look like.`,
        reason: "Even a rough sketch turns a vague idea into something you can execute.",
        estimated_cost: 0,
        estimated_hours: 1,
        steps: [
          {
            title: "Sketch + size",
            description: "Rough sketch + target dimensions.",
            skill_level: "beginner",
            estimated_minutes: 30,
            tools_needed: ["paper", "pencil"],
          },
        ],
      },
      {
        title: "Gather materials",
        description: "Source what you need.",
        reason: "Batch sourcing saves runs back to the store.",
        estimated_cost: 60,
        estimated_hours: 1,
        steps: [
          {
            title: "Shop for materials",
            description: "Hit the craft store with a complete list.",
            skill_level: "beginner",
            estimated_minutes: 60,
            tools_needed: [],
          },
        ],
      },
      {
        title: "Make it",
        description: "Put it together.",
        reason: "",
        estimated_cost: 0,
        estimated_hours: 3,
        steps: [
          {
            title: "Build / create",
            description: "The actual making.",
            skill_level: "intermediate",
            estimated_minutes: 180,
            tools_needed: [],
          },
        ],
      },
      {
        title: "Finish",
        description: "Final touches.",
        reason: "",
        estimated_cost: 10,
        estimated_hours: 1,
        steps: [
          {
            title: "Final pass",
            description: "Clean up, polish, sign your work.",
            skill_level: "beginner",
            estimated_minutes: 45,
            tools_needed: [],
          },
        ],
      },
    ],
    suggested_milestones: [],
  };
}

function buildDecorPlan(projectName: string): MockPlanOutput {
  return {
    stages: [
      {
        title: "Plan the look",
        description: `Decide what ${projectName} needs.`,
        reason: "Decor without a plan becomes clutter.",
        estimated_cost: 0,
        estimated_hours: 1,
        steps: [
          {
            title: "Mood board",
            description: "Gather references, colors, textures.",
            skill_level: "beginner",
            estimated_minutes: 45,
            tools_needed: [],
          },
        ],
      },
      {
        title: "Source",
        description: "Buy what you need.",
        reason: "",
        estimated_cost: 150,
        estimated_hours: 2,
        steps: [
          {
            title: "Shop",
            description: "Hit stores / online with a list.",
            skill_level: "beginner",
            estimated_minutes: 120,
            tools_needed: [],
          },
        ],
      },
      {
        title: "Install / style",
        description: "Put it up.",
        reason: "",
        estimated_cost: 10,
        estimated_hours: 2,
        steps: [
          {
            title: "Hang + arrange",
            description: "Level, center, adjust until it feels right.",
            skill_level: "beginner",
            estimated_minutes: 120,
            tools_needed: ["drill", "level", "measuring tape"],
          },
        ],
      },
    ],
    suggested_milestones: [],
  };
}

function buildOutdoorPlan(projectName: string): MockPlanOutput {
  return {
    stages: [
      {
        title: "Plan & locate",
        description: `Site, dimensions, and footings for ${projectName}.`,
        reason:
          "Where it sits matters for drainage, setbacks, and view. Call 811 before digging.",
        estimated_cost: 30,
        estimated_hours: 3,
        steps: [
          {
            title: "Call 811 (or local equivalent)",
            description: "Free utility locate — always do this before digging.",
            skill_level: "beginner",
            estimated_minutes: 15,
            tools_needed: [],
          },
          {
            title: "Lay out footprint",
            description: "Stakes + string. Square the corners.",
            skill_level: "beginner",
            estimated_minutes: 90,
            tools_needed: ["stakes", "string", "tape measure"],
          },
        ],
      },
      {
        title: "Foundation / footings",
        description: "Concrete, posts, or piers.",
        reason: "",
        estimated_cost: 400,
        estimated_hours: 10,
        steps: [
          {
            title: "Dig holes",
            description: "Below frost line in cold climates.",
            skill_level: "intermediate",
            estimated_minutes: 240,
            tools_needed: ["post hole digger", "shovel"],
          },
          {
            title: "Pour concrete / set posts",
            description: "Mix, pour, level, wait to cure.",
            skill_level: "intermediate",
            estimated_minutes: 300,
            tools_needed: ["wheelbarrow", "concrete mixer"],
          },
        ],
      },
      {
        title: "Frame",
        description: "Structural framing of the build.",
        reason: "",
        estimated_cost: 600,
        estimated_hours: 12,
        steps: [
          {
            title: "Build the frame",
            description: "Per plan.",
            skill_level: "intermediate",
            estimated_minutes: 720,
            tools_needed: ["circular saw", "drill", "impact driver"],
          },
        ],
      },
      {
        title: "Finish",
        description: "Cladding, roofing, seal.",
        reason: "",
        estimated_cost: 400,
        estimated_hours: 10,
        steps: [
          {
            title: "Install cladding / roofing",
            description: "Per plan.",
            skill_level: "intermediate",
            estimated_minutes: 480,
            tools_needed: [],
          },
          {
            title: "Seal / stain",
            description: "Protect from weather.",
            skill_level: "beginner",
            estimated_minutes: 120,
            tools_needed: [],
          },
        ],
      },
    ],
    suggested_milestones: [],
  };
}

function buildGenericRenoPlan(
  projectName: string,
  renoType: string,
  _intake: Record<string, unknown>
): MockPlanOutput {
  return {
    stages: [
      {
        title: "Plan & test",
        description: `Scope ${projectName} for your ${renoType}.`,
        reason:
          "Every reno opens with the same question: what's actually behind those walls? Test first.",
        estimated_cost: 150,
        estimated_hours: 4,
        steps: [
          {
            title: "Measure + photo current state",
            description: "Document everything before touching anything.",
            skill_level: "beginner",
            estimated_minutes: 90,
            tools_needed: ["tape measure", "phone"],
          },
        ],
      },
      {
        title: "Demo",
        description: "Strip what's being replaced.",
        reason: "",
        estimated_cost: 300,
        estimated_hours: 10,
        steps: [
          {
            title: "Demo surfaces",
            description: "Controlled demolition. Dust containment matters.",
            skill_level: "intermediate",
            estimated_minutes: 480,
            tools_needed: ["pry bar", "hammer", "P100 respirator"],
          },
        ],
      },
      {
        title: "Rough-in & repair",
        description: "Fix the bones before finishes.",
        reason: "",
        estimated_cost: 800,
        estimated_hours: 20,
        steps: [
          {
            title: "Structural / mechanical rough-in",
            description: "Per scope of work.",
            skill_level: "advanced",
            estimated_minutes: 1200,
            tools_needed: [],
          },
        ],
      },
      {
        title: "Finish",
        description: "Surfaces, fixtures, paint.",
        reason: "",
        estimated_cost: 800,
        estimated_hours: 14,
        steps: [
          {
            title: "Finish work",
            description: "Drywall, paint, flooring, trim.",
            skill_level: "intermediate",
            estimated_minutes: 840,
            tools_needed: [],
          },
        ],
      },
    ],
    suggested_milestones: [],
  };
}
