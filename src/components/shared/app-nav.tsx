"use client";

import { LayoutGrid, Menu, Mic, Target, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AppNav(): React.JSX.Element {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { href: "/direktfraga", Icon: Target, id: "nav-direct", label: "Direktfråga" },
    { href: "/alla-partier", Icon: LayoutGrid, id: "nav-grid", label: "Alla partier" },
    { href: "/debatt", Icon: Mic, id: "nav-debate", label: "Debatt" },
  ];

  return (
    <nav className="app-nav">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo - plain anchor, not next/link, so a click always does a full page reload and clears all state */}
        <a className="flex items-center gap-2 px-2 py-3 no-underline" href="/" id="nav-logo">
          <span className="block font-black font-heading text-black text-lg leading-tight">Partisimulator 2026</span>
        </a>

        {/* Nav tabs - inline from sm upward */}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {tabs.map((tab) => (
            <Link
              className={`nav-tab ${pathname === tab.href ? "active" : ""}`}
              href={tab.href}
              id={tab.id}
              key={tab.href}
            >
              <tab.Icon aria-hidden="true" className="h-4 w-4" />
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Hamburger toggle - below sm only */}
        <div className="sm:hidden">
          <button
            aria-controls="nav-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Stäng menyn" : "Öppna menyn"}
            className="nav-tab nav-menu-toggle"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            {isMenuOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel - below sm only */}
      {isMenuOpen && (
        <div
          className="flex flex-col gap-2 border-t px-4 py-3 sm:hidden"
          id="nav-menu"
          style={{ borderColor: "var(--border)" }}
        >
          {tabs.map((tab) => (
            <Link
              className={`nav-tab justify-center ${pathname === tab.href ? "active" : ""}`}
              href={tab.href}
              id={tab.id}
              key={tab.href}
              onClick={() => setIsMenuOpen(false)}
            >
              <tab.Icon aria-hidden="true" className="h-4 w-4" />
              {tab.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
