"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  ClipboardText,
  Images,
  CurrencyCircleDollar,
  Camera,
} from "@phosphor-icons/react/dist/ssr";

interface ProjectNavProps {
  projectId: string;
}

const tabs = [
  { key: "overview", label: "Overview", icon: SquaresFour, href: "" },
  { key: "plan", label: "Plan", icon: ClipboardText, href: "/plan" },
  { key: "mood-board", label: "Mood Board", icon: Images, href: "/mood-board" },
  { key: "budget", label: "Budget", icon: CurrencyCircleDollar, href: "/budget" },
  { key: "photos", label: "Photos", icon: Camera, href: "/photos" },
];

export function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname();
  const base = `/projects/project/${projectId}`;

  function isActive(tab: (typeof tabs)[number]) {
    if (tab.key === "overview") {
      return pathname === base;
    }
    return pathname === `${base}${tab.href}`;
  }

  return (
    <nav className="flex gap-1 border-b border-hairline overflow-x-auto">
      {tabs.map((tab) => {
        const active = isActive(tab);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={`${base}${tab.href}`}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
              active ? "text-walnut" : "text-graphite hover:text-ink"
            }`}
          >
            <Icon
              size={16}
              weight={active ? "duotone" : "regular"}
            />
            <span className="hidden sm:inline">{tab.label}</span>
            {/* Editorial underline on active tab */}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 bg-walnut" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
