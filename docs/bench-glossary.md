# Bench Glossary — Terms & Definitions

A shared dictionary for building Bench consistently. Reference this before naming categories, labels, fields, or UI copy.

---

## Core Concepts

| Term | Definition |
|---|---|
| **Project** | A thing the user is building (bathroom remodel, shaker cabinet, clay jewelry holder) |
| **Stage** | A logical phase within a project (Demo, Rough-In, Tile, Finish) |
| **Step** | A concrete task within a stage (remove shower fixtures, cut PEX lines) |
| **Sub-task** | A micro-action checklist item within a step (turn off water, disconnect supply lines) |
| **Template** | A published, cloneable project plan another user can "Build This" from |
| **Bunker** | The user's private workspace — their projects, toolbox, shopping list |

## Toolbox

| Term | Definition |
|---|---|
| **Tool** | A durable item used to do work (hammer, circular saw, drill, tape measure) |
| **PPE** | Personal Protective Equipment — safety gear worn to prevent injury (respirator, safety glasses, gloves, ear protection, hard hat). **PPE is the category. "Safety" is not a separate category.** |
| **Consumable** | An expendable item attached to a tool that needs restocking or replacement (saw blade, respirator cartridge, sandpaper, drill bits, air compressor oil) |
| **Material** | A project-specific supply you buy and use up (tile, PEX pipe, grout, concrete mix, contractor bags). NOT the same as a tool. |

## Tool Categories (for the toolbox)

| Category key | Display label | Examples |
|---|---|---|
| `hand_tool` | Hand Tools | Hammer, pry bar, screwdriver, chisel, handsaw |
| `power_tool` | Power Tools | Circular saw, drill, reciprocating saw, sander, air compressor |
| `ppe` | PPE | Respirator, safety glasses, gloves, ear protection, dust mask, hard hat |
| `measuring` | Measuring | Tape measure, level, speed square, stud finder, laser level |
| `other` | Other | Anything that doesn't fit above |

**Note:** "Safety" was previously a separate category but it's the same as PPE. Merged into `ppe`. If a tool is specifically a safety device but not worn (e.g., fire extinguisher, first aid kit), it goes in `other`.

## Tool Statuses

| Status key | Display label | Meaning |
|---|---|---|
| `ready` | Ready | Good to go, works fine |
| `needs_repair` | Needs repair | Functional but has an issue that should be addressed |
| `broken` | Broken | Not usable until fixed or replaced |
| `missing` | Missing | Can't find it |

## Future Terms (not built yet)

| Term | Definition |
|---|---|
| **Storage Shed** | The community-verified catalog of tools. Users contribute entries; verified ones are available to everyone. |
| **Build mode** | The future execution view where steps become a swipe-through interface |
| **Creator** | A user who publishes templates for others to clone |
| **Attribution chain** | How revenue flows when templates are nested inside other projects |
