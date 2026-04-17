/**
 * A pinned-polaroid card that peels back on hover.
 *
 * Structure (desktop md+):
 *   - Text content layer (headline + body) sits at the base of the card.
 *   - A "photo" layer covers the card by default (the mini UI mock).
 *   - A brass pin sits at top-center, above both layers.
 *   - On hover, the photo layer rotates 172deg around its TOP edge, flipping
 *     up and back. Since the parent has `perspective` and the photo layer
 *     has `backface-visibility: visible`, the flipped photo ends up above
 *     the card, upside-down, showing its backside (which is the same mock
 *     content mirror-flipped — the "I can still see the image but it's
 *     upside-down" effect Codi asked for).
 *
 * Mobile fallback:
 *   - `:hover` doesn't work on touch, so on mobile the card flattens into
 *     a traditional stacked layout: mock on top, text below, no flip.
 */

interface PeelCardProps {
  Icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "duotone" | "bold" | "fill" | "light" | "thin";
    className?: string;
  }>;
  /** All-caps eyebrow tag (renders as a .text-caption label). */
  eyebrow: string;
  /** Handwritten script "header" revealed when the photo peels away. */
  title: string;
  /** Body copy — the paragraph describing the feature in detail. */
  body: string;
  /** The mock UI shown on the photo surface. */
  mock: React.ReactNode;
}

export function PeelCard({ Icon, eyebrow, title, body, mock }: PeelCardProps) {
  return (
    <article className="group relative md:h-[440px] md:[perspective:1400px]">
      {/* Mobile stacked layout — shown on mobile only. */}
      <div className="md:hidden rounded-2xl bg-paper border border-hairline overflow-hidden">
        <div className="bg-ivory border-b border-hairline p-5 flex items-center justify-center min-h-[220px]">
          {mock}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-walnut">
            <Icon size={16} weight="duotone" />
            <p className="text-caption uppercase tracking-[0.18em]">
              {eyebrow}
            </p>
          </div>
          <h3 className="mt-2 font-display text-xl text-ink">{title}</h3>
          <p className="mt-2 text-graphite leading-relaxed text-sm">{body}</p>
        </div>
      </div>

      {/* Desktop — text layer hidden behind photo, photo peels on hover. */}
      <div className="hidden md:flex md:absolute md:inset-0 md:rounded-2xl md:bg-paper md:border md:border-hairline md:p-6 md:pt-10 md:flex-col md:justify-center">
        <div className="flex items-center gap-2 text-walnut">
          <Icon size={16} weight="duotone" />
          <p className="text-caption uppercase tracking-[0.2em]">{eyebrow}</p>
        </div>
        <h3 className="mt-3 font-hand-lg text-walnut leading-[1.1]">
          {title}
        </h3>
        <p className="mt-4 text-ink leading-relaxed">{body}</p>
        <p className="mt-auto pt-4 text-caption uppercase tracking-[0.2em] text-graphite">
          hover to peek ↑
        </p>
      </div>

      {/* Brass pin — stays fixed at top center while the photo swings up.
          Rendered above the photo layer so it always reads as on top. */}
      <div
        className="hidden md:block absolute top-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        aria-hidden="true"
      >
        <div className="relative w-3 h-3 rounded-full bg-walnut shadow-[0_2px_4px_rgba(26,17,10,0.35)]">
          <div className="absolute inset-0.5 rounded-full bg-brass opacity-80" />
        </div>
      </div>

      {/* Photo layer — covers everything, flips on hover. */}
      <div
        className="
          hidden md:block
          absolute inset-0 rounded-2xl overflow-hidden
          bg-ivory border border-hairline shadow-md
          origin-top
          [transform-style:preserve-3d]
          [backface-visibility:visible]
          transition-transform duration-[700ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          group-hover:[transform:rotateX(172deg)]
          group-hover:shadow-xl
        "
      >
        <div className="absolute inset-0 flex items-center justify-center p-5">
          {mock}
        </div>
      </div>
    </article>
  );
}
