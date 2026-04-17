import Link from "next/link";

export function MarketingTopNav({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="border-b border-hairline bg-paper/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="font-display text-xl text-ink">
          Bench
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-graphite">
          <Link href="/who-its-for" className="hover:text-ink transition-colors">
            Who it&apos;s for
          </Link>
          <Link href="/pricing" className="hover:text-ink transition-colors">
            Pricing
          </Link>
          <Link href="/join-beta" className="hover:text-ink transition-colors">
            Join the beta
          </Link>
        </nav>
        {isAuthed ? (
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 rounded-lg bg-walnut hover:bg-walnut-dark text-white text-sm font-semibold px-4 py-2 transition-colors"
          >
            My projects
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-ink hover:text-walnut transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
