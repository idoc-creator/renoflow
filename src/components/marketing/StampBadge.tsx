/**
 * Circular "stamp" badge — editorial accent inspired by the ABOUT ME wheel
 * in Etta's Acres. Use sparingly as a hand-stamped mark (one or two per
 * marketing page at most).
 *
 * Text is rendered in Caveat (handwriting). The outer ring is solid
 * walnut; the whole stamp is rotated -6deg for the casual "stamped here"
 * feel.
 */
export function StampBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`stamp shrink-0 ${className}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
