"use client";

import Link from "next/link";
import { FiPlus } from "react-icons/fi";

export function NewProjectButton() {
  return (
    <Link
      href="/bunker/project/new"
      className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
    >
      <FiPlus className="h-4 w-4" />
      New Project
    </Link>
  );
}
