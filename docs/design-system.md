# Bench Design System — "Field Notes"

**Single source of truth for colors, type, and patterns.** Updates go here first, then into `src/app/globals.css`, then the live reference page at `/design` reflects them automatically.

---

## Vibe

> Field notes from a workshop. Editorial, warm, quietly premium. Bench looks like it belongs next to a leather-bound notebook and a brass tape measure — not an iPad in a coffee shop. **Muted, grounded, lived-in. Nothing loud.** Heavy on images, quiet on chrome.

Inspiration: marble-and-brass bathrooms, vintage Porsche oxblood + pearl, golden retriever warmth, autumn fields, bathroom fixtures in antique gold.

Anti-patterns:
- Loud saturated reds / primary blues / neon accents
- Black backgrounds (too heavy for a planner)
- Pastel-only palettes (too soft to act as a brand)
- Thin 400-weight body text (too hard to read)
- Busy backgrounds behind image grids

---

## Color tokens

All colors live in `globals.css` under `@theme inline`. Changes propagate through Tailwind utility classes.

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `--color-paper` | `#ffffff` | Page background. Pure white. |
| `--color-ivory` (alias: `cream`) | `#faf7f0` | Warm cream — secondary surfaces, hover states on white, section backgrounds. Like Porsche pearl interior. |
| `--color-surface` | `#ffffff` | Cards and elevated surfaces. |
| `--color-ink` (alias: `charcoal`) | `#1a110a` | Body text / headlines. Near-black with warm undertone. |
| `--color-graphite` (alias: `warm-gray`) | `#6b5d51` | Secondary text, metadata, captions. Warm brown-grey. |
| `--color-hairline` (alias: `border-warm`) | `#e8e0d1` | Borders, dividers. Visible but gentle. |

### Iconic + accents (all warm earth)

| Token | Hex | Use |
|---|---|---|
| **`--color-walnut`** (alias: `terracotta`, `warm-brown`) | `#4a2b17` | **ICONIC.** Primary CTAs, active nav, "Part of" chips, brand moments. Use with intent — scarcity makes it iconic. |
| `--color-walnut-dark` (alias: `terracotta-dark`) | `#2a1608` | Walnut hover state. |
| `--color-brass` | `#b5874e` | Secondary accent — antique gold. Milestones, "Order soon" badges, featured moments. |
| `--color-honey` | `#c9935b` | Tertiary — warm tan. Renovation category tints, warm highlights. |
| `--color-moss` (alias: `sage`) | `#6b7d4a` | Positive semantic — "In progress" pill, progress bars, success confirmations, sub-project count chip. |
| `--color-moss-dark` (alias: `sage-dark`) | `#4c5c32` | Moss hover state. |
| `--color-oxblood` | `#7a2e2e` | Reserved for destructive actions only. Delete buttons, danger zones. Never iconic. |

### Where each color shows up

- **Walnut** (iconic): "New Project" button, intake Send, "Save preferences," active nav chips, "Part of [parent]" pill, filter selected state.
- **Brass**: milestone kind icons (permits, inspections), "Order soon" Overview badge, featured card accents, optional monogram moments.
- **Honey**: renovation category gradient fill (with walnut icon/text on top), warm highlights.
- **Moss**: "In progress" status pill, progress bars, sub-project count chip, success confirmations.
- **Ivory**: card hover states on white, secondary surfaces on dense pages, form field backgrounds.
- **Oxblood**: delete buttons, danger zones, destructive "Clear all" actions.

### Status colors (semantic)

| Status | Color |
|---|---|
| Planning | graphite on ivory |
| In progress | white on moss |
| Complete | white on `green-700` (#15803d — standard Tailwind, distinct from moss) |
| Paused | white on `amber-600` (#d97706) |
| Destructive | white on oxblood |

---

## Typography

### Fonts

- **Display — Fraunces** (variable serif with SOFT/WONK/opsz axes). Editorial contemporary serif. Headlines, project names, feature titles.
- **Body — Inter Tight** (400-700). Slightly tighter than Inter; stronger weight reads cleaner at small sizes.

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

**Letter-spacing:** `-0.025em` on display, `-0.02em` on h1/h2, default elsewhere.

**Weight defaults:** body copy is 500 (not 400). Strong is 600. Headlines are 600.

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

### The Walnut rule
The iconic walnut brown shows up in:
- Primary CTA buttons
- Active nav states
- "New project" button
- Sub-project link chips ("Part of X")
- Brand moments (logo, header accents)
- Destructive actions — never. Destructive uses oxblood.

Everything else defaults to ink / graphite / white / ivory. **If everything is walnut, nothing is.** Scarcity is the point.

### Paper grid (default Bunker background)
Pure white + a whisper 28px notebook grid. Applied as the default Bunker shell background via `.bg-grid`. Subtle enough (0.035 alpha) to sit behind images, text, and cards without competing.

```css
.bg-grid {
  background-image:
    linear-gradient(to right, rgba(26, 17, 10, 0.035) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(26, 17, 10, 0.035) 1px, transparent 1px);
  background-size: 28px 28px;
}
```

Already applied to the Bunker shell main content. Safe to layer images and cards on top — the alpha is low enough that images dominate visually.

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
| 2026-04-18 | Deepened walnut to richer espresso #4a2b17. Bunker bg is now pure white + muted gridline texture by default (was warm cream). |
| 2026-04-18 | Field Notes palette — walnut iconic, all warm earth tones, pure white background. Retired Pin Red. |
| 2026-04-17 | Initial editorial palette + Fraunces / Inter Tight typography. |
