"use client";

import { useEffect } from "react";

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimulationModal({ isOpen, onClose }: SimulationModalProps): React.JSX.Element | null {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
    >
      <div className="modal-content">
        {/* Header */}
        <div
          className="flex items-center justify-between border-black border-b-2 p-5"
          style={{ backgroundColor: "var(--color-ink)", borderRadius: "13px 13px 0 0" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗳️</span>
            <h2 className="font-black text-white text-xl" id="modal-title">
              Vad är PartiSimulator?
            </h2>
          </div>
          <button
            aria-label="Stäng"
            className="font-black text-2xl text-white leading-none hover:text-gray-300"
            id="modal-close-btn"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Disclaimer box */}
          <div
            className="rounded-xl border-2 p-4 font-semibold text-sm"
            style={{
              backgroundColor: "#fff3cd",
              borderColor: "#f0a500",
              color: "#7a4f00",
            }}
          >
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 text-xl">⚠️</span>
              <div>
                <strong className="mb-1 block text-base">VIKTIG INFORMATION</strong>
                Alla svar i denna app är <strong>AI-genererade simuleringar</strong>. De representerar INTE faktiska
                uttalanden, åsikter eller officiella positioner från partiledarna eller partierna. Se alltid
                ansvarsfriskrivningen i varje svarsbubbla.
              </div>
            </div>
          </div>

          <div className="space-y-3 font-semibold text-gray-700 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <strong className="block text-base text-black">AI-simulering</strong>
                Svaren genereras av Claude AI (Anthropic) och grundas <strong>uteslutande</strong> i respektive partis
                valmanifest 2026 via RAG (Retrieval-Augmented Generation).
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <strong className="block text-base text-black">Baserat på manifest</strong>
                AI:n hittar aldrig på fakta. Om en fråga inte besvaras av manifestet, säger simuleringen det explicit.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎮</span>
              <div>
                <strong className="block text-base text-black">Utbildningssyfte</strong>
                Appen är skapad för att på ett lekfullt sätt hjälpa dig förstå partiernas ståndpunkter inför valet 2026
                – inte för att sprida politisk propaganda.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <strong className="block text-base text-black">Lekfull design</strong>
                Den tecknade, lekfulla designen är ett medvetet val för att understryka att detta är en{" "}
                <strong>simulering</strong> – inte ett officiellt politiskt verktyg.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            className="cartoon-btn cartoon-btn-primary w-full"
            id="modal-understand-btn"
            onClick={onClose}
            type="button"
          >
            Jag förstår – låt oss köra! 🎯
          </button>
        </div>
      </div>
    </div>
  );
}
