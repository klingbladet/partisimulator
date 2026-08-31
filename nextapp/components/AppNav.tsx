"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SimulationModal from "./SimulationModal";

export default function AppNav() {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  const tabs = [
    { href: "/", label: "🎯 Direktfråga", id: "nav-direct" },
    { href: "/grid", label: "🔲 Alla partier", id: "nav-grid" },
    { href: "/debatt", label: "🎤 Debatt", id: "nav-debate" },
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
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline group" id="nav-logo">
            <span className="text-2xl group-hover:animate-bounce">🗳️</span>
            <div>
              <span className="font-black text-lg text-black leading-tight block">
                PartiSimulator
              </span>
              <span className="text-xs font-semibold text-gray-500 leading-none block">
                Valet 2026
              </span>
            </div>
          </Link>

          {/* Nav tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                id={tab.id}
                className={`nav-tab ${pathname === tab.href ? "active" : ""}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Info button */}
          <button
            onClick={() => setModalOpen(true)}
            className="cartoon-btn cartoon-btn-ghost text-sm"
            id="nav-info-btn"
            aria-label="Vad är detta?"
          >
            ℹ️ Vad är detta?
          </button>
        </div>
      </nav>

      <SimulationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
