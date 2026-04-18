import { ImageSquare } from "@phosphor-icons/react/dist/ssr";

interface PolaroidProps {
  /** Image src — omit to render the light-grey placeholder. */
  src?: string;
  alt?: string;
  /** Handwritten caption under the photo. */
  caption?: string;
  /** Hint shown in the placeholder when no src is provided. */
  placeholderHint?: string;
  /** Rotation direction for the "taped on a page" feel. */
  tilt?: "left" | "right" | "none";
  /** Tape color — warm washi variants. */
  tapeColor?: "brass" | "moss" | "honey";
  /** Tailwind size classes (e.g. "w-48"). Default fits most uses. */
  sizeClass?: string;
  /** Extra classes for positioning / z-index / shadow overrides. */
  className?: string;
}

/**
 * Polaroid-style photo card with washi tape at the top. White-bordered
 * frame, subtle rotation, caption in handwritten script. When no `src` is
 * passed, renders an intentional grey placeholder so the layout still
 * looks composed before real images are ready.
 */
export function Polaroid({
  src,
  alt,
  caption,
  placeholderHint = "photo",
  tilt = "left",
  tapeColor = "brass",
  sizeClass = "w-52",
  className = "",
}: PolaroidProps) {
  const tiltCls = {
    left: "rotate-nudge-left",
    right: "rotate-nudge-right",
    none: "",
  }[tilt];

  return (
    <div
      className={`relative ${sizeClass} ${tiltCls} ${className} bg-paper p-3 pb-6 shadow-lg border border-hairline`}
      style={{ borderRadius: "2px" }}
    >
      {/* Washi tape at the top center */}
      <span
        className={`washi-tape washi-${tapeColor}`}
        style={{
          top: "-10px",
          left: "50%",
          width: "72px",
          transform: "translateX(-50%) rotate(-4deg)",
        }}
      />

      {/* Photo area — aspect-square, placeholder if no src */}
      <div className="relative aspect-square overflow-hidden bg-hairline/60">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? caption ?? ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-graphite opacity-55"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(26,17,10,0.035) 0, rgba(26,17,10,0.035) 1px, transparent 1px, transparent 12px)",
            }}
          >
            <ImageSquare size={22} weight="duotone" />
            <p className="text-caption uppercase tracking-[0.18em]">
              {placeholderHint}
            </p>
          </div>
        )}
      </div>

      {/* Caption — handwritten script */}
      {caption && (
        <p className="mt-2 text-center font-hand text-base text-ink leading-tight">
          {caption}
        </p>
      )}
    </div>
  );
}
