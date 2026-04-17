import Link from "next/link";

/**
 * Public-site footer — shown under the landing, pricing, privacy, terms,
 * and any other marketing page. Editorial, quiet, left-aligned so the eye
 * doesn't land on it harder than the hero above.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-paper mt-20">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-display text-xl text-ink">Bench</p>
          <p className="mt-2 text-sm text-graphite">
            Stop pinning. Start building.
          </p>
          <p className="mt-4 text-caption uppercase tracking-[0.18em] text-walnut">
            In beta, 2026
          </p>
        </div>

        <FooterCol title="Product">
          <FooterLink href="/">Home</FooterLink>
          <FooterLink href="/pricing">Pricing</FooterLink>
          <FooterLink href="/join-beta">Join the beta</FooterLink>
        </FooterCol>

        <FooterCol title="Legal">
          <FooterLink href="/privacy">Privacy</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
        </FooterCol>

        <FooterCol title="Contact">
          <FooterLink href="mailto:hello@benchapp.co">hello@benchapp.co</FooterLink>
          <FooterLink href="/auth/login">Sign in</FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-graphite">
          <p>© {new Date().getFullYear()} Bench. Built by makers, for makers.</p>
          <p>Made in Oregon.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-caption uppercase tracking-[0.18em] text-walnut mb-3">
        {title}
      </p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-ink hover:text-walnut transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
