"use client";

import PartyAvatar from "@/components/party-avatar";
import SimulationDisclaimer from "@/components/simulation-disclaimer";
import type { PartyPersona } from "@/types/party";

interface DebateBubbleProps {
  party?: PartyPersona;
  isUser?: boolean;
  speakerName?: string;
  text: string;
  sources?: string[];
  isStreaming?: boolean;
  turnNumber: number;
}

export function DebateBubble({
  party,
  isUser = false,
  speakerName,
  text,
  sources = [],
  isStreaming = false,
  turnNumber,
}: DebateBubbleProps): React.JSX.Element {
  // User / Moderator Bubble (Right-aligned)
  if (isUser || !party) {
    return (
      <div className="flex w-full justify-end" id={`debate-turn-${turnNumber}`}>
        <div className="flex max-w-[85%] flex-col items-end md:max-w-[72%]">
          {/* Header / Name */}
          <div className="mb-1 flex items-center gap-1.5 px-1 font-black text-indigo-800 text-xs">
            <span>🎙️</span>
            <span>{speakerName || "Du (Debattledare)"}</span>
            <span className="rounded-full border border-indigo-200 bg-indigo-100 px-1.5 py-0.5 font-extrabold text-[10px] text-indigo-700">
              #{turnNumber}
            </span>
          </div>

          {/* Bubble (right speech bubble with rounded-tr-none) */}
          <div
            className="rounded-2xl rounded-tr-xs border-2 border-black p-3.5 text-white shadow-[3px_3px_0px_#1a1a1a]"
            style={{ backgroundColor: "#4338ca" }}
          >
            <p className="whitespace-pre-wrap font-bold text-sm leading-relaxed md:text-base">{text}</p>
          </div>
        </div>
      </div>
    );
  }

  // Politician Bubble (Left-aligned)
  return (
    <div className="flex w-full justify-start" id={`debate-turn-${turnNumber}`}>
      <div className="flex max-w-[88%] items-start gap-2.5 md:max-w-[76%]">
        {/* Politician Avatar with Party Logo Badge */}
        <div className="mt-0.5">
          <PartyAvatar
            badgeClassName="absolute -bottom-1 -right-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5 shadow-xs"
            badgeSize={19}
            className="relative overflow-hidden rounded-full border-2 border-black shadow-[2px_2px_0px_#1a1a1a]"
            party={party}
            size={42}
            style={{ backgroundColor: party.color }}
          />
        </div>

        {/* Bubble & Metadata */}
        <div className="flex min-w-0 flex-1 flex-col items-start">
          {/* Header / Name */}
          <div className="mb-1 flex items-center gap-2 px-1 font-black text-xs">
            <span style={{ color: party.color }}>{party.displayName}</span>
            <span className="font-bold text-gray-500">({party.abbreviation})</span>
            <span className="font-bold text-[10px] text-gray-400">#{turnNumber}</span>
          </div>

          {/* Bubble (left speech bubble with rounded-tl-none) */}
          <div className="w-full overflow-hidden rounded-2xl rounded-tl-xs border-2 border-black bg-white shadow-[3px_3px_0px_#1a1a1a]">
            {/* Party color accent stripe */}
            <div className="h-1.5 w-full" style={{ backgroundColor: party.color }} />

            {/* Bubble text */}
            <div className="p-3.5">
              {isStreaming && !text ? (
                <span className="typing-dots" style={{ color: party.color }}>
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <>
                  <p
                    className={`whitespace-pre-wrap font-semibold text-gray-800 text-sm leading-relaxed md:text-base ${isStreaming ? "streaming-cursor" : ""}`}
                  >
                    {text}
                  </p>

                  {/* Sources */}
                  {sources.length > 0 && (
                    <div className="mt-2.5 space-y-1 border-gray-100 border-t pt-2">
                      {sources.map((source) => (
                        <div className="answer-bubble-source text-xs" key={source}>
                          <span>📄</span>
                          <span>{source}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Disclaimer */}
                  {text && <SimulationDisclaimer party={party} variant="compact" />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DebateSpeakerSelectorProps {
  parties: PartyPersona[];
  onSelectSpeaker: (partyId: string) => void;
  disabled?: boolean;
  currentSpeakerId?: string;
}

export function DebateSpeakerSelector({
  parties,
  onSelectSpeaker,
  disabled = false,
  currentSpeakerId,
}: DebateSpeakerSelectorProps): React.JSX.Element {
  return (
    <div className="cartoon-card p-4">
      <h3 className="mb-3 font-black text-gray-500 text-sm uppercase tracking-wide">🎤 Vem talar härnäst?</h3>
      <div className="flex flex-wrap gap-2">
        {parties.map((party) => {
          const isActive = party.id === currentSpeakerId;
          return (
            <button
              aria-pressed={isActive}
              className="flex items-center gap-2 rounded-lg border-2 px-3 py-2 font-bold text-sm transition-all"
              disabled={disabled}
              id={`debate-speaker-btn-${party.id}`}
              key={party.id}
              onClick={() => !disabled && onSelectSpeaker(party.id)}
              style={{
                backgroundColor: isActive ? party.color : "white",
                borderColor: party.color,
                boxShadow: isActive ? `3px 3px 0px ${party.color}88` : "none",
                color: isActive ? party.textColor : party.color,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                transform: isActive ? "translate(-1px, -1px)" : "none",
              }}
              type="button"
            >
              <PartyAvatar
                badgeClassName="absolute -bottom-1 -right-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5"
                badgeSize={13}
                className="relative overflow-hidden rounded-full border border-current"
                party={party}
                size={26}
              />
              {party.abbreviation}
            </button>
          );
        })}
      </div>
    </div>
  );
}
