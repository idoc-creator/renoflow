import Link from "next/link";

interface TopNavProps {
  isAuthed: boolean;
}

export default function TopNav({ isAuthed }: TopNavProps) {
  return (
    <header className="sticky top-0 z-10 bg-cream/80 backdrop-blur border-b border-border-warm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="flex flex-col leading-tight shrink-0">
          <span className="font-serif text-2xl text-charcoal">Bench</span>
          <span className="hidden md:block text-xs text-warm-gray">
            Stop pinning. Start building.
          </span>
        </Link>
        <div className="flex-1 max-w-md">
          <input
            type="search"
            placeholder="Search projects..."
            className="w-full px-4 py-2 bg-white rounded-full border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
        </div>
        <div className="ml-auto">
          {isAuthed ? (
            <Link
              href="/projects"
              className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors"
            >
              Projects
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
