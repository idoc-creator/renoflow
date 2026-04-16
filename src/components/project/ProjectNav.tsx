"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiClipboard,
  FiImage,
  FiDollarSign,
  FiCamera,
} from "react-icons/fi";

interface ProjectNavProps {
  projectId: string;
}

const tabs = [
  { key: "overview", label: "Overview", icon: FiGrid, href: "" },
  { key: "plan", label: "Plan", icon: FiClipboard, href: "/plan" },
  { key: "mood-board", label: "Mood Board", icon: FiImage, href: "/mood-board" },
  { key: "budget", label: "Budget", icon: FiDollarSign, href: "/budget" },
  { key: "photos", label: "Photos", icon: FiCamera, href: "/photos" },
];

export function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname();
  const base = `/bunker/project/${projectId}`;

  function isActive(tab: (typeof tabs)[number]) {
    if (tab.key === "overview") {
      return pathname === base;
    }
    return pathname === `${base}${tab.href}`;
  }

  return (
    <nav className="flex gap-1 rounded-lg bg-cream p-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.key}
            href={`${base}${tab.href}`}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              active
                ? "bg-white text-sage-dark shadow-sm"
                : "text-warm-gray hover:text-charcoal"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
