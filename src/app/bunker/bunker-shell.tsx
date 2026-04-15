"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiShoppingCart,
  FiDollarSign,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useState } from "react";

const navItems = [
  { href: "/bunker", label: "Projects", icon: FiHome },
  { href: "/bunker/shopping-list", label: "Shopping List", icon: FiShoppingCart },
  { href: "/bunker/earnings", label: "Earnings", icon: FiDollarSign },
];

export function BunkerShell({
  displayName,
  children,
}: {
  displayName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 flex-col border-r border-border-warm bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-6">
          <span className="text-lg font-bold text-sage-dark">RenoFlow</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sage/10 text-sage-dark"
                    : "text-warm-gray hover:bg-cream hover:text-charcoal"
                }`}
              >
                <item.icon className="h-5 w-5" />
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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border-warm bg-white transition-transform md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <span className="text-lg font-bold text-sage-dark">RenoFlow</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-warm-gray hover:text-warm-gray"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sage/10 text-sage-dark"
                    : "text-warm-gray hover:bg-cream hover:text-charcoal"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border-warm bg-white px-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-warm-gray hover:text-charcoal md:hidden"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-charcoal">
              {displayName}
            </span>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-warm-gray transition-colors hover:bg-cream hover:text-charcoal"
              >
                <FiLogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="flex border-t border-border-warm bg-white md:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active
                    ? "text-sage"
                    : "text-warm-gray hover:text-warm-gray"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
