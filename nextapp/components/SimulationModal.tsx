"use client";

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimulationModal({ isOpen, onClose }: SimulationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 border-b-2 border-black flex items-center justify-between"
          style={{ backgroundColor: "var(--color-ink)", borderRadius: "13px 13px 0 0" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗳️</span>
            <h2 id="modal-title" className="text-white font-black text-xl">
              Vad är PartiSimulator?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 font-black text-2xl leading-none"
            aria-label="Stäng"
            id="modal-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Disclaimer box */}
          <div
            className="p-4 rounded-xl border-2 font-semibold text-sm"
            style={{
              backgroundColor: "#fff3cd",
              borderColor: "#f0a500",
              color: "#7a4f00",
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <strong className="block text-base mb-1">VIKTIG INFORMATION</strong>
                Alla svar i denna app är <strong>AI-genererade simuleringar</strong>. De
                representerar INTE faktiska uttalanden, åsikter eller officiella positioner från
                partiledarna eller partierna. Se alltid disclaimern i varje svarsbubble.
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm font-semibold text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <strong className="block text-base text-black">AI-simulering</strong>
                Svaren genereras av Claude AI (Anthropic) och grundas <strong>uteslutande</strong> i
                respektive partis valmanifest 2026 via RAG (Retrieval-Augmented Generation).
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <strong className="block text-base text-black">Baserat på manifest</strong>
                AI:n hittar aldrig på fakta. Om en fråga inte besvaras av manifestet, säger
                simuleringen det explicit.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎮</span>
              <div>
                <strong className="block text-base text-black">Utbildningssyfte</strong>
                Appen är skapad för att på ett lekfullt sätt hjälpa dig förstå partiernas
                ståndpunkter inför valet 2026 – inte för att sprida politisk propaganda.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <strong className="block text-base text-black">Lekfull design</strong>
                Den tecknade, lekfulla designen är ett medvetet val för att understryka att detta
                är en <strong>simulering</strong> – inte ett officiellt politiskt verktyg.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            className="cartoon-btn cartoon-btn-primary w-full"
            onClick={onClose}
            id="modal-understand-btn"
          >
            Jag förstår – låt oss köra! 🎯
          </button>
        </div>
      </div>
    </div>
  );
}
