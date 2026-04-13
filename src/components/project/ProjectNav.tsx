"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiClipboard, FiImage, FiShoppingBag } from "react-icons/fi";

interface ProjectNavProps {
  projectId: string;
}

const tabs = [
  { key: "plan", label: "Plan", icon: FiClipboard, href: "" },
  { key: "mood-board", label: "Mood Board", icon: FiImage, href: "/mood-board" },
  { key: "shopping-list", label: "Shopping List", icon: FiShoppingBag, href: "/shopping-list" },
];

export function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname();
  const base = `/dashboard/projects/${projectId}`;

  function isActive(tab: (typeof tabs)[number]) {
    if (tab.key === "plan") {
      return pathname === base;
    }
    return pathname === `${base}${tab.href}`;
  }

  return (
    <nav className="flex gap-1 rounded-lg bg-slate-100 p-1">
      {tabs.map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.key}
            href={`${base}${tab.href}`}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
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
