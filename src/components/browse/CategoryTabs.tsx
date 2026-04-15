import Link from "next/link";

const CATEGORIES = [
  { key: "all", label: "All", href: "/" },
  { key: "renovation", label: "Renovation", href: "/explore/renovation" },
  { key: "furniture", label: "Furniture", href: "/explore/furniture" },
  { key: "decor", label: "Decor", href: "/explore/decor" },
  { key: "craft", label: "Craft", href: "/explore/craft" },
  { key: "outdoor", label: "Outdoor", href: "/explore/outdoor" },
];

export default function CategoryTabs({ active }: { active: string }) {
  return (
    <nav className="border-b border-border-warm bg-cream">
      <div className="max-w-7xl mx-auto px-4 flex gap-6 py-3 overflow-x-auto">
        {CATEGORIES.map((cat) => {
          const isActive = cat.key === active;
          return (
            <Link
              key={cat.key}
              href={cat.href}
              className={
                isActive
                  ? "text-charcoal border-b-2 border-terracotta font-semibold pb-1 whitespace-nowrap"
                  : "text-warm-gray hover:text-charcoal pb-1 whitespace-nowrap"
              }
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
