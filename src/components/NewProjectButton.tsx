"use client";

import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export function NewProjectButton() {
  return (
    <Link
      href="/projects/project/new"
      className="inline-flex items-center gap-2 rounded-lg bg-walnut px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-walnut-dark"
    >
      <Plus size={16} weight="bold" />
      New Project
    </Link>
  );
}
