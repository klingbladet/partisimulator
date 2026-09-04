"use client";

import { FileText, Send } from "lucide-react";
import Image from "next/image";
import PartyAvatar from "@/components/party-avatar";
import StanceMeter from "@/components/stance-meter";
import type { Stance } from "@/lib/sources";
import type { PartyPersona } from "@/types/party";

interface AnswerBubbleProps {
  party: PartyPersona;
  text: string;
  longAnswer?: string;
  sources?: string[];
  stance?: Stance;
  isStreaming?: boolean;
  isEmpty?: boolean;
  compact?: boolean;
  onContinueChat?: () => void;
}

export default function AnswerBubble({
  party,
  text,
  longAnswer,
  sources = [],
  stance,
  isStreaming = false,
  isEmpty = false,
  compact = false,
  onContinueChat,
}: AnswerBubbleProps): React.JSX.Element {
  const isLoading = isEmpty && isStreaming;

  return (
    <div className="answer-bubble" id={`answer-${party.id}`} style={{ borderColor: party.color }}>
      {/* Header */}
      <div className="answer-bubble-header" style={{ backgroundColor: party.color, borderColor: party.color }}>
        <PartyAvatar
          badgeClassName="absolute -bottom-1 -end-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5 shadow-sm"
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
          <div className="ms-auto">
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
            <div className="ms-auto flex items-center rounded-lg border border-white/30 bg-white/20 px-2 py-1">
              <div className="relative me-1 h-4 w-4">
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
            <div className="flex-1">
              {stance && (
                <div className="mb-2">
                  <StanceMeter stance={stance} />
                </div>
              )}

              <p
                className={`whitespace-pre-wrap ${isStreaming ? "streaming-cursor" : ""}`}
                style={{ color: "var(--color-ink)" }}
              >
                {text || ""}
              </p>

              {longAnswer && (
                <details className="mt-2.5 text-sm">
                  <summary className="cursor-pointer font-bold" style={{ color: party.color }}>
                    Läs mer
                  </summary>
                  <p className="mt-1.5 whitespace-pre-wrap" style={{ color: "var(--color-ink)" }}>
                    {longAnswer}
                  </p>
                </details>
              )}
            </div>

            {onContinueChat && (text || longAnswer) && (
              <button
                className="cartoon-btn cartoon-btn-primary mt-3 w-full text-xs"
                onClick={onContinueChat}
                type="button"
              >
                <Send className="h-3.5 w-3.5" />
                Fortsätt chatta
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer — sources always last, at the very end of the card */}
      {!isLoading && (
        <div className="answer-bubble-footer">
          {sources.length > 0 ? (
            sources.map((source) => (
              <div className="answer-bubble-source" key={source}>
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{source}</span>
              </div>
            ))
          ) : (
            <div className="answer-bubble-source">
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Ingen källa finns</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
