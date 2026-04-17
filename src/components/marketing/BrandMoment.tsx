import { ImageSquare } from "@phosphor-icons/react/dist/ssr";

interface BrandMomentProps {
  /** The handwritten quote rendered as an overlay. Short — 1–3 lines max. */
  quote: string;
  /** Optional. If set, renders an <img>; otherwise shows a grey placeholder. */
  imageUrl?: string;
  /** Alt text when an image is provided. */
  imageAlt?: string;
  /** Hint for what the final image should be — shown in the placeholder. */
  placeholderHint?: string;
  /** Which corner the quote sits in. Defaults to bottom-left. */
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Aspect ratio class for the banner. */
  aspectClass?: string;
}

/**
 * Full-bleed brand-moment banner — handwritten quote overlaid on a full-
 * width image (or light-grey placeholder if the image isn't ready). Modeled
 * on the Etta's Acres cow-photo-with-script moment. Use sparingly — one per
 * marketing page, between dense content sections, to give the eye a pause.
 */
export function BrandMoment({
  quote,
  imageUrl,
  imageAlt,
  placeholderHint = "illustration or photo coming",
  anchor = "bottom-left",
  aspectClass = "aspect-[21/9]",
}: BrandMomentProps) {
  const anchorCls = {
    "top-left": "top-10 left-8 md:top-16 md:left-16 text-left",
    "top-right": "top-10 right-8 md:top-16 md:right-16 text-right",
    "bottom-left": "bottom-10 left-8 md:bottom-16 md:left-16 text-left",
    "bottom-right": "bottom-10 right-8 md:bottom-16 md:right-16 text-right",
  }[anchor];

  return (
    <section className="relative w-full overflow-visible border-y border-hairline">
      <div className={`relative w-full ${aspectClass}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt ?? ""}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <PlaceholderFill hint={placeholderHint} />
        )}

        {/* Washi tape at the top corners — "taped to the page" feel.
            Lives inside the section so it sits on top of the image. */}
        <span
          className="washi-tape washi-brass"
          style={{
            top: "-10px",
            left: "8%",
            width: "96px",
            transform: "rotate(-6deg)",
          }}
        />
        <span
          className="washi-tape washi-moss"
          style={{
            top: "-10px",
            right: "10%",
            width: "84px",
            transform: "rotate(5deg)",
          }}
        />

        {/* Quote — walnut handwriting, positioned by anchor */}
        <figure className={`absolute max-w-[85%] md:max-w-xl ${anchorCls}`}>
          <blockquote className="font-hand-lg text-walnut drop-shadow-sm leading-[1.15]">
            {quote.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </blockquote>
        </figure>
      </div>
    </section>
  );
}

function PlaceholderFill({ hint }: { hint: string }) {
  // Light grey placeholder with subtle diagonal stripes + centered hint.
  // Meant to look intentionally unfinished — like graph paper waiting for ink.
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-hairline/60"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(26,17,10,0.035) 0, rgba(26,17,10,0.035) 1px, transparent 1px, transparent 14px)",
      }}
    >
      <div className="flex flex-col items-center gap-2 text-graphite opacity-50">
        <ImageSquare size={28} weight="duotone" />
        <p className="text-caption uppercase tracking-[0.22em]">{hint}</p>
      </div>
    </div>
  );
}
