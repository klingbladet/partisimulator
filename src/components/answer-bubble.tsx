"use client";

import Image from "next/image";
import PartyAvatar from "@/components/party-avatar";
import SimulationDisclaimer from "@/components/simulation-disclaimer";
import type { PartyPersona } from "@/types/party";

interface AnswerBubbleProps {
  party: PartyPersona;
  text: string;
  sources?: string[];
  isStreaming?: boolean;
  isEmpty?: boolean;
  compact?: boolean;
}

export default function AnswerBubble({
  party,
  text,
  sources = [],
  isStreaming = false,
  isEmpty = false,
  compact = false,
}: AnswerBubbleProps): React.JSX.Element {
  const isLoading = isEmpty && isStreaming;

  return (
    <div className="answer-bubble" id={`answer-${party.id}`} style={{ borderColor: party.color }}>
      {/* Header */}
      <div className="answer-bubble-header" style={{ backgroundColor: party.color, borderColor: party.color }}>
        <PartyAvatar
          badgeClassName="absolute -bottom-1 -right-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5 shadow-sm"
          badgeSize={18}
          className="relative overflow-hidden rounded-full border-2 border-white"
          party={party}
          size={42}
        />
        <div>
          <div className="font-black text-sm leading-tight" style={{ color: party.textColor }}>
            {party.displayName}
          </div>
          <div className="font-semibold text-xs leading-tight" style={{ color: party.textColor, opacity: 0.85 }}>
            {party.partyName}
          </div>
        </div>
        {isStreaming ? (
          <div className="ml-auto">
            <span
              aria-label="Genererar svar..."
              className="typing-dots"
              role="status"
              style={{ color: party.textColor }}
            >
              <span />
              <span />
              <span />
            </span>
          </div>
        ) : (
          party.logoFile && (
            <div className="ml-auto flex items-center rounded-lg border border-white/30 bg-white/20 px-2 py-1">
              <div className="relative mr-1 h-4 w-4">
                <Image
                  alt={party.partyName}
                  className="object-contain"
                  fill
                  sizes="16px"
                  src={`/assets/logos/${party.logoFile}`}
                />
              </div>
              <span className="font-black text-xs" style={{ color: party.textColor }}>
                {party.abbreviation}
              </span>
            </div>
          )
        )}
      </div>

      {/* Body */}
      <div className={`answer-bubble-body ${compact ? "text-sm" : ""}`}>
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <span className="typing-dots" style={{ color: party.color }}>
              <span />
              <span />
              <span />
            </span>
            <span className="font-semibold text-sm">Hämtar manifest-kontext...</span>
          </div>
        ) : (
          <>
            <p
              className={`whitespace-pre-wrap ${isStreaming ? "streaming-cursor" : ""}`}
              style={{ color: "var(--color-ink)" }}
            >
              {text || ""}
            </p>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="mt-3 space-y-1">
                {sources.map((source) => (
                  <div className="answer-bubble-source" key={source}>
                    <span className="flex-shrink-0">📄</span>
                    <span>{source}</span>
                  </div>
                ))}
              </div>
            )}

            {/* MANDATORY DISCLAIMER — NEVER HIDDEN */}
            {(text || isStreaming) && <SimulationDisclaimer party={party} />}
          </>
        )}
      </div>
    </div>
  );
}
