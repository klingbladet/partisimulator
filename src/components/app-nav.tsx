"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SimulationModal from "./simulation-modal";

export default function AppNav(): React.JSX.Element {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  const tabs = [
    { href: "/", id: "nav-direct", label: "🎯 Direktfråga" },
    { href: "/grid", id: "nav-grid", label: "🔲 Alla partier" },
    { href: "/debatt", id: "nav-debate", label: "🎤 Debatt" },
  ];

  return (
    <>
      <nav
        className="sticky top-0 z-40 border-b-3"
        style={{
          backgroundColor: "var(--color-cream)",
          borderBottom: "3px solid var(--color-ink)",
          boxShadow: "0 3px 0px var(--color-ink)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          {/* Logo */}
          <Link className="group flex items-center gap-2 no-underline" href="/" id="nav-logo">
            <span className="text-2xl group-hover:animate-bounce">🗳️</span>
            <div>
              <span className="block font-black text-black text-lg leading-tight">PartiSimulator</span>
              <span className="block font-semibold text-gray-500 text-xs leading-none">Valet 2026</span>
            </div>
          </Link>

          {/* Nav tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <Link
                className={`nav-tab ${pathname === tab.href ? "active" : ""}`}
                href={tab.href}
                id={tab.id}
                key={tab.href}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Info button */}
          <button
            aria-label="Vad är detta?"
            className="cartoon-btn cartoon-btn-ghost text-sm"
            id="nav-info-btn"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            ℹ️ Vad är detta?
          </button>
        </div>
      </nav>

      <SimulationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
