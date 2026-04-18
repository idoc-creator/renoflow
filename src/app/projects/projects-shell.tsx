"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Toolbox,
  UserCircle,
  SignOut,
  List,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

/*
  Icons are Phosphor (weight "duotone" default for a softer editorial feel).
  Swapped from Feather in 2026-04-18 per Codi's "cuter icons" request —
  wrench + gear felt too technical.
*/
const navItems = [
  { href: "/projects", label: "Projects", icon: House },
  { href: "/projects/toolbox", label: "My Toolbox", icon: Toolbox },
  { href: "/projects/account", label: "Account", icon: UserCircle },
];

export function ProjectsShell({
  displayName,
  children,
}: {
  displayName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-paper">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 flex-col border-r border-hairline bg-paper md:flex">
        <div className="flex h-16 items-center border-b border-hairline px-6">
          <span className="font-display text-xl text-ink">Bench</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-walnut/10 text-walnut"
                    : "text-graphite hover:bg-ivory hover:text-ink"
                }`}
              >
                <Icon
                  size={20}
                  weight={active ? "duotone" : "regular"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-hairline bg-paper transition-transform md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-hairline px-6">
          <span className="font-display text-xl text-ink">Bench</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-graphite hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-walnut/10 text-walnut"
                    : "text-graphite hover:bg-ivory hover:text-ink"
                }`}
              >
                <Icon
                  size={20}
                  weight={active ? "duotone" : "regular"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-hairline bg-paper px-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-graphite hover:text-ink md:hidden"
          >
            <List size={20} />
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-ink">
              {displayName}
            </span>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-graphite transition-colors hover:bg-ivory hover:text-ink"
              >
                <SignOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-paper bg-grid p-4 md:p-6">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="flex border-t border-hairline bg-paper md:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
                  active ? "text-walnut" : "text-graphite hover:text-ink"
                }`}
              >
                <Icon
                  size={20}
                  weight={active ? "duotone" : "regular"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
