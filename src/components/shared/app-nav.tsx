"use client";

import { LayoutGrid, Mic, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppNav(): React.JSX.Element {
  const pathname = usePathname();

  const tabs = [
    { href: "/", Icon: Target, id: "nav-direct", label: "Direktfråga" },
    { href: "/grid", Icon: LayoutGrid, id: "nav-grid", label: "Alla partier" },
    { href: "/debatt", Icon: Mic, id: "nav-debate", label: "Debatt" },
  ];

  return (
    <nav className="app-nav">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        {/* Logo — plain anchor, not next/link, so a click always does a full page reload and clears all state */}
        <a className="flex items-center gap-2 no-underline" href="/" id="nav-logo">
          <div>
            <span className="block font-black text-black text-lg leading-tight">PartiSimulator</span>
            <span className="block font-semibold text-gray-500 text-xs leading-none">Valet 2026</span>
          </div>
        </a>

        {/* Nav tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <Link
              className={`nav-tab ${pathname === tab.href ? "active" : ""}`}
              href={tab.href}
              id={tab.id}
              key={tab.href}
            >
              <tab.Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
