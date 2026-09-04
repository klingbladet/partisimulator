"use client";

import type { PartyPersona } from "@/types/party";

interface SimulationDisclaimerProps {
  party: PartyPersona;
  variant?: "full" | "compact";
}

/** Mandatory "this is an AI simulation, not a real quote" notice on every answer and debate bubble. Never hidden. */
export default function SimulationDisclaimer({
  party,
  variant = "full",
}: SimulationDisclaimerProps): React.JSX.Element {
  if (variant === "compact") {
    return (
      <div className="answer-bubble-disclaimer mt-2 text-[11px]" role="note">
        <span className="flex-shrink-0">⚠️</span>
        <span>
          AI-simulering · {party.displayName} ({party.partyName})
        </span>
      </div>
    );
  }

  return (
    <div aria-label="Viktig information om AI-simulering" className="answer-bubble-disclaimer" role="note">
      <span className="flex-shrink-0 text-base">⚠️</span>
      <span>
        <strong>AI-simulerat svar</strong>, i stil med {party.displayName}, baserat på {party.partyName}s valmanifest
        2026. <strong>Ej ett verkligt citat eller officiellt uttalande.</strong>
      </span>
    </div>
  );
}
