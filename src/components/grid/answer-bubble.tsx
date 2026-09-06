"use client";

import { Send } from "lucide-react";
import Image from "next/image";
import PartyAvatar from "@/components/shared/party-avatar";
import SourcesList from "@/components/shared/sources-list";
import StanceMeter from "@/components/shared/stance-meter";
import TypingDots from "@/components/shared/typing-dots";
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
        <div className="min-w-0 flex-1">
          <div className="truncate font-black text-sm leading-tight" style={{ color: party.textColor }}>
            {party.displayName}
          </div>
          <div
            className="truncate font-semibold text-xs leading-tight"
            style={{ color: party.textColor, opacity: 0.85 }}
          >
            {party.partyName}
          </div>
        </div>
        {party.logoFile && (
          <div className="ms-auto flex items-center rounded-lg border border-white/30 bg-white/20 p-1.5">
            <div className="relative h-4 w-4">
              <Image
                alt={party.partyName}
                className="object-contain"
                fill
                sizes="16px"
                src={`/assets/logos/${party.logoFile}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className={`answer-bubble-body ${compact ? "text-sm" : ""}`}>
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <TypingDots color={party.color} />
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
          <SourcesList emptyLabel="Ingen källa finns" sources={sources} />
        </div>
      )}
    </div>
  );
}
