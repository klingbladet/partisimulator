"use client";

import Image from "next/image";
import { PartyPersona } from "@/lib/parties";

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
}: DebateBubbleProps) {
  // User / Moderator Bubble (Right-aligned)
  if (isUser || !party) {
    return (
      <div className="flex justify-end w-full" id={`debate-turn-${turnNumber}`}>
        <div className="max-w-[85%] md:max-w-[72%] flex flex-col items-end">
          {/* Header / Name */}
          <div className="flex items-center gap-1.5 mb-1 px-1 text-xs font-black text-indigo-800">
            <span>🎙️</span>
            <span>{speakerName || "Du (Debattledare)"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 font-extrabold text-indigo-700 border border-indigo-200">
              #{turnNumber}
            </span>
          </div>

          {/* Bubble (right speech bubble with rounded-tr-none) */}
          <div
            className="rounded-2xl rounded-tr-xs border-2 border-black p-3.5 shadow-[3px_3px_0px_#1a1a1a] text-white"
            style={{ backgroundColor: "#4338ca" }}
          >
            <p className="text-sm md:text-base font-bold whitespace-pre-wrap leading-relaxed">
              {text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Politician Bubble (Left-aligned)
  return (
    <div className="flex justify-start w-full" id={`debate-turn-${turnNumber}`}>
      <div className="max-w-[88%] md:max-w-[76%] flex items-start gap-2.5">
        {/* Politician Avatar with Party Logo Badge */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div
            className="relative rounded-full overflow-hidden border-2 border-black shadow-[2px_2px_0px_#1a1a1a]"
            style={{ width: 42, height: 42, backgroundColor: party.color }}
          >
            <Image
              src={`/avatars/${party.avatarFile}`}
              alt={party.displayName}
              fill
              className="object-cover object-top"
              sizes="42px"
            />
          </div>

          {/* Official Party Logo Badge */}
          {party.logoFile && (
            <div
              className="absolute -bottom-1 -right-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5 shadow-xs"
              style={{ width: 19, height: 19 }}
              title={party.partyName}
            >
              <div className="relative w-full h-full">
                <Image
                  src={`/logos/${party.logoFile}`}
                  alt={party.partyName}
                  fill
                  className="object-contain"
                  sizes="19px"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bubble & Metadata */}
        <div className="flex-1 flex flex-col items-start min-w-0">
          {/* Header / Name */}
          <div className="flex items-center gap-2 mb-1 px-1 text-xs font-black">
            <span style={{ color: party.color }}>{party.displayName}</span>
            <span className="text-gray-500 font-bold">({party.abbreviation})</span>
            <span className="text-gray-400 text-[10px] font-bold">#{turnNumber}</span>
          </div>

          {/* Bubble (left speech bubble with rounded-tl-none) */}
          <div
            className="rounded-2xl rounded-tl-xs border-2 border-black overflow-hidden bg-white shadow-[3px_3px_0px_#1a1a1a] w-full"
          >
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
                    className={`text-sm md:text-base whitespace-pre-wrap font-semibold text-gray-800 leading-relaxed ${isStreaming ? "streaming-cursor" : ""}`}
                  >
                    {text}
                  </p>

                  {/* Sources */}
                  {sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 space-y-1">
                      {sources.map((s, i) => (
                        <div key={i} className="answer-bubble-source text-xs">
                          <span>📄</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Disclaimer */}
                  {text && (
                    <div className="answer-bubble-disclaimer mt-2 text-[11px]" role="note">
                      <span className="flex-shrink-0">⚠️</span>
                      <span>
                        AI-simulering · {party.displayName} ({party.partyName})
                      </span>
                    </div>
                  )}
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
}: DebateSpeakerSelectorProps) {
  return (
    <div className="cartoon-card p-4">
      <h3 className="font-black text-sm text-gray-500 uppercase tracking-wide mb-3">
        🎤 Vem talar härnäst?
      </h3>
      <div className="flex flex-wrap gap-2">
        {parties.map((party) => {
          const isActive = party.id === currentSpeakerId;
          return (
            <button
              key={party.id}
              onClick={() => !disabled && onSelectSpeaker(party.id)}
              disabled={disabled}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 font-bold text-sm transition-all"
              style={{
                backgroundColor: isActive ? party.color : "white",
                borderColor: party.color,
                color: isActive ? party.textColor : party.color,
                boxShadow: isActive ? `3px 3px 0px ${party.color}88` : "none",
                transform: isActive ? "translate(-1px, -1px)" : "none",
                opacity: disabled ? 0.6 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
              id={`debate-speaker-btn-${party.id}`}
              aria-pressed={isActive}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="relative rounded-full overflow-hidden border border-current"
                  style={{ width: 26, height: 26 }}
                >
                  <Image
                    src={`/avatars/${party.avatarFile}`}
                    alt={party.displayName}
                    fill
                    className="object-cover object-top"
                    sizes="26px"
                  />
                </div>
                {party.logoFile && (
                  <div
                    className="absolute -bottom-1 -right-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5"
                    style={{ width: 13, height: 13 }}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={`/logos/${party.logoFile}`}
                        alt={party.partyName}
                        fill
                        className="object-contain"
                        sizes="13px"
                      />
                    </div>
                  </div>
                )}
              </div>
              {party.abbreviation}
            </button>
          );
        })}
      </div>
    </div>
  );
}
