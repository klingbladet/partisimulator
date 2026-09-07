"use client";

import { ChevronDown, Flag, Loader2, RotateCcw, Send, SkipForward, Square, XCircle } from "lucide-react";
import type { PartyPersona } from "@/types/party";

interface DebateControlsProps {
  debateFinished: boolean;
  isEndingDebate: boolean;
  isLoading: boolean;
  userInterjection: string;
  onUserInterjectionChange: (value: string) => void;
  onUserInterjectionSubmit: () => void;
  autoMode: boolean;
  parties: PartyPersona[];
  targetSpeakerId: string | null;
  onTargetSpeakerChange: (partyId: string | null) => void;
  onNextSpeaker: () => void;
  onStop: () => void;
  onEndDebate: () => void;
  onResetDebate: () => void;
}

/** Compact bottom bar: interjection input (with an optional "aim this at a party" picker) plus labeled stop/next/end debate controls. */
export default function DebateControls({
  debateFinished,
  isEndingDebate,
  isLoading,
  userInterjection,
  onUserInterjectionChange,
  onUserInterjectionSubmit,
  autoMode,
  parties,
  targetSpeakerId,
  onTargetSpeakerChange,
  onNextSpeaker,
  onStop,
  onEndDebate,
  onResetDebate,
}: DebateControlsProps): React.JSX.Element {
  if (debateFinished) {
    return (
      <div className="cartoon-card flex flex-col items-center gap-3 p-6 text-center">
        <Flag aria-hidden="true" className="h-8 w-8" />
        <p className="font-black text-black text-xl">Debatten är slut!</p>
        <p className="font-semibold text-gray-600 text-sm">Nu återstår bara att räkna rösterna.</p>
        <button className="cartoon-btn cartoon-btn-primary" id="new-debate-btn" onClick={onResetDebate} type="button">
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Ny debatt
        </button>
      </div>
    );
  }

  if (isEndingDebate) {
    return (
      <div className="cartoon-card flex flex-col items-center gap-3 p-6 text-center">
        <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin" />
        <p className="font-black text-black text-xl">Slutpläderingar pågår...</p>
        <p className="font-semibold text-gray-600 text-sm">Varje parti får sista ordet innan debatten avslutas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="cartoon-card flex flex-1 flex-col gap-2 p-3">
        <div className="relative">
          <select
            aria-label="Rikta frågan till"
            className="cartoon-input appearance-none pr-10 text-sm"
            id="target-speaker-select"
            onChange={(event) => onTargetSpeakerChange(event.target.value || null)}
            title="Rikta frågan till"
            value={targetSpeakerId ?? ""}
          >
            <option value="">Nästa i tur</option>
            {parties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.displayName}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-6 h-4 w-4 -translate-y-1/2 text-gray-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            className="cartoon-input flex-1 text-sm"
            id="user-interjection-input"
            onChange={(event) => onUserInterjectionChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onUserInterjectionSubmit();
              }
            }}
            placeholder="Ställ en fråga i debatten..."
            type="text"
            value={userInterjection}
          />

          <button
            aria-label="Skicka"
            className="cartoon-btn cartoon-btn-primary"
            disabled={!userInterjection.trim()}
            id="user-interjection-submit"
            onClick={onUserInterjectionSubmit}
            title="Skicka"
            type="button"
          >
            <Send aria-hidden="true" className="h-4 w-4" />
            Skicka
          </button>
        </div>
      </div>

      <div className="cartoon-card flex flex-wrap items-center gap-2 p-3">
        {isLoading && (
          <button
            aria-label="Avbryt"
            className="cartoon-btn cartoon-btn-danger flex-1"
            id="debate-stop-btn"
            onClick={onStop}
            title="Avbryt"
            type="button"
          >
            <Square aria-hidden="true" className="h-4 w-4" fill="currentColor" />
            Avbryt
          </button>
        )}

        {!autoMode && (
          <button
            aria-label="Nästa talare"
            className="cartoon-btn flex-1"
            disabled={isLoading}
            id="next-speaker-btn"
            onClick={onNextSpeaker}
            style={{ backgroundColor: "var(--color-ink)", color: "var(--color-white)" }}
            title="Nästa talare"
            type="button"
          >
            <SkipForward aria-hidden="true" className="h-4 w-4" />
            Nästa talare
          </button>
        )}

        <button
          aria-label="Avsluta debatten"
          className="cartoon-btn cartoon-btn-danger flex-1"
          disabled={isLoading}
          id="end-debate-btn"
          onClick={onEndDebate}
          title="Avsluta debatten"
          type="button"
        >
          <XCircle aria-hidden="true" className="h-4 w-4" />
          Avsluta
        </button>
      </div>
    </div>
  );
}
