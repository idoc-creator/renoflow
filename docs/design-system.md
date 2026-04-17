# Bench Design System

**Single source of truth for colors, type, and patterns.** Updates go here first, then into `src/app/globals.css`, then the live reference page at `/design` reflects them automatically.

---

## Vibe

> Editorial workshop. Notebook-paper warmth, bold serif headlines, ink-black body text, a single iconic accent that signals "this is Bench" the way Pinterest's red signals Pinterest. Clean enough to manage a renovation; warm enough not to feel like a spreadsheet. **Heavy on images**, quiet on chrome.

Anti-patterns:
- Black backgrounds (too heavy for a planner)
- Pastel-only palettes (too soft to act as a pin/signal)
- Thin 400-weight body text (too hard to read)
- Busy backgrounds behind image grids

---

## Color tokens

All colors live in `globals.css` under `@theme inline`. Changes propagate through Tailwind utility classes.

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `--color-paper` (alias: `cream`) | `#faf7f1` | Default page background. Warm white with a whisper of grit. |
| `--color-surface` | `#ffffff` | Cards and elevated surfaces on top of paper. |
| `--color-ink` (alias: `charcoal`) | `#141211` | Body text, headlines — near-black with warm undertone. |
| `--color-graphite` (alias: `warm-gray`) | `#57544f` | Secondary text, metadata, captions. |
| `--color-hairline` (alias: `border-warm`) | `#d9d3c7` | Borders, dividers — slightly more visible than before for editorial feel. |

### Accents

| Token | Hex | Use |
|---|---|---|
| **`--color-pin`** (alias: `terracotta`) | `#c1272d` | **The iconic color.** Primary action, active nav state, links that matter. Use sparingly — scarcity is what makes it iconic. |
| `--color-pin-dark` (alias: `terracotta-dark`) | `#8e1c22` | Hover state for pin. |
| `--color-moss` (alias: `sage`) | `#4a7a5a` | Positive/success states (progress, completed). |
| `--color-moss-dark` (alias: `sage-dark`) | `#375e44` | Hover state for moss. |
| `--color-rust` (alias: `warm-brown`) | `#8b6f4e` | Tertiary — warm accent for categories, etc. |

### Status colors (semantic)

| Status | Color |
|---|---|
| Planning | graphite on paper |
| In progress | white on moss |
| Complete | white on `#15803d` (green-700) |
| Paused | white on `#b45309` (amber-700) |

---

## Typography

### Fonts

- **Display — Fraunces** (variable 100-900, SOFT/WONK axes). Editorial contemporary serif. Headlines, project names, feature titles.
- **Body — Inter Tight** (400-700). Slightly tighter than Inter, stronger weight reads cleaner at small sizes.

Loaded via `next/font/google` in `layout.tsx`.

### Type scale

| Class | Size / Line-height | Weight | Font |
|---|---|---|---|
| `.font-display-xl` | 3.5rem / 1.05 | 600 | Fraunces |
| `.font-display-lg` | 2.5rem / 1.1 | 600 | Fraunces |
| `.font-display` | 1.75rem / 1.2 | 600 | Fraunces |
| `h1` (default) | 2rem / 1.15 | 600 | Fraunces |
| `h2` (default) | 1.5rem / 1.2 | 600 | Fraunces |
| `h3` (default) | 1.25rem / 1.3 | 600 | Fraunces |
| body | 0.9375rem / 1.5 | 500 | Inter Tight |
| `.text-caption` | 0.75rem / 1.4 | 500 | Inter Tight |

**Letter-spacing:** `-0.02em` on display, `-0.01em` on h1/h2, default elsewhere.

**Weight defaults:** body copy is 500 (not 400). Strong is 600. Headlines are 600 (not 400 like before).

---

## Spacing

Tailwind defaults. Card padding: `p-4` or `p-5`. Content container: `max-w-6xl`.

## Radii

- `rounded-lg` for buttons, chips → 0.5rem (8px)
- `rounded-xl` for inner cards → 0.75rem (12px)
- `rounded-2xl` for major cards / modals → 1rem (16px)
- `rounded-full` for pills + badges

## Shadows

- Cards: `shadow-sm`
- Hover on cards: `shadow-lg`
- Modals / sticky footers: `shadow-xl`

---

## Patterns

### The Pin Red rule
The iconic red shows up in:
- Primary CTA buttons
- Active nav state
- "New project" button
- Sub-project link chips ("Part of X")
- Permit / inspection milestone icons
- Destructive actions — never. Destructive uses a different red (`red-700`).

Everything else defaults to ink / graphite / white. If everything is pin-red, nothing is.

### Paper grid (optional accent)
A subtle 24px notebook grid background is available as the `.bg-grid` utility for spots that want a workshop feel (intake page hero, empty states).

```css
.bg-grid {
  background-image:
    linear-gradient(to right, rgba(20,18,17,0.035) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20,18,17,0.035) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

Do NOT apply to pages dense with images (it competes). Use for text-heavy pages or empty-state surfaces only.

### Image-first cards
Cards with a cover image: the image IS the card. Chrome collapses to pills on top + hover overlay. No footer strip unless specifically needed.

Cards without a cover image: gradient tinted by category + icon + name visible. Same hover overlay so the interaction is consistent.

---

## Reference page

Live tokens + components: **`/design`** — renders every swatch, type specimen, button variant, and card state. First stop when proposing any visual change.

---

## Changelog

| Date | Change |
|---|---|
| 2026-04-17 | Initial editorial palette + Fraunces/Inter Tight typography. Terracotta promoted to Pin Red. |
