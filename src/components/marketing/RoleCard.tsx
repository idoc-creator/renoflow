import { BetaSignupForm, type RoleInterest } from "./BetaSignupForm";

interface RoleCardProps {
  /** Phosphor icon component — imported by caller, passed in. */
  Icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "duotone" | "bold" | "fill" | "light" | "thin";
    className?: string;
  }>;
  /** Short caps-label above the role name, e.g. "Tier 1 — The core user". */
  eyebrow: string;
  /** The role display name. */
  title: string;
  /** Short one-line framing. */
  tagline: string;
  /** Body copy — 2-3 sentences explaining who this is. */
  body: string;
  /** Optional bullet list of "This is you if..." signals. */
  signals?: string[];
  /** Form's analytics source tag (required). */
  source: string;
  /** Form's role interest tag (required). */
  roleInterest: RoleInterest;
  /** CTA label on the signup button. */
  cta: string;
  /** Highlighted/featured card gets stronger treatment (Tier 1 DIYer). */
  featured?: boolean;
}

export function RoleCard({
  Icon,
  eyebrow,
  title,
  tagline,
  body,
  signals,
  source,
  roleInterest,
  cta,
  featured = false,
}: RoleCardProps) {
  return (
    <article
      className={`rounded-2xl border p-6 md:p-8 ${
        featured
          ? "bg-paper border-walnut shadow-sm"
          : "bg-paper border-hairline"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            featured ? "bg-walnut text-white" : "bg-ivory text-walnut"
          }`}
        >
          <Icon size={24} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption uppercase tracking-[0.2em] text-walnut">
            {eyebrow}
          </p>
          <h3 className="mt-1 font-display text-2xl text-ink">{title}</h3>
          <p className="mt-1 text-graphite">{tagline}</p>
        </div>
      </div>

      <p className="mt-5 text-ink leading-relaxed">{body}</p>

      {signals && signals.length > 0 && (
        <div className="mt-5 rounded-xl bg-ivory border border-hairline p-4">
          <p className="text-caption uppercase tracking-[0.18em] text-walnut mb-2">
            This is you if…
          </p>
          <ul className="space-y-1.5">
            {signals.map((s) => (
              <li
                key={s}
                className="text-sm text-ink flex items-start gap-2 leading-relaxed"
              >
                <span className="text-walnut mt-0.5">·</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <BetaSignupForm
          source={source}
          roleInterest={roleInterest}
          cta={cta}
        />
      </div>
    </article>
  );
}
