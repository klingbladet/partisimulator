"use client";

import Image from "next/image";
import { PartyPersona } from "@/lib/parties";

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
}: AnswerBubbleProps) {
  const isLoading = isEmpty && isStreaming;

  return (
    <div
      className="answer-bubble"
      style={{ borderColor: party.color }}
      id={`answer-${party.id}`}
    >
      {/* Header */}
      <div
        className="answer-bubble-header"
        style={{ backgroundColor: party.color, borderColor: party.color }}
      >
        <div
          className="relative rounded-full overflow-hidden border-2 border-white flex-shrink-0"
          style={{ width: 40, height: 40 }}
        >
          <Image
            src={`/avatars/${party.avatarFile}`}
            alt={party.displayName}
            fill
            className="object-cover object-top"
            sizes="40px"
          />
        </div>
        <div>
          <div
            className="font-black text-sm leading-tight"
            style={{ color: party.textColor }}
          >
            {party.displayName}
          </div>
          <div
            className="text-xs font-semibold leading-tight"
            style={{ color: party.textColor, opacity: 0.85 }}
          >
            {party.partyName}
          </div>
        </div>
        {isStreaming && (
          <div className="ml-auto">
            <span
              className="typing-dots"
              style={{ color: party.textColor }}
              aria-label="Genererar svar..."
            >
              <span />
              <span />
              <span />
            </span>
          </div>
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
            <span className="text-sm font-semibold">Hämtar manifest-kontext...</span>
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
                {sources.map((source, i) => (
                  <div key={i} className="answer-bubble-source">
                    <span className="flex-shrink-0">📄</span>
                    <span>{source}</span>
                  </div>
                ))}
              </div>
            )}

            {/* MANDATORY DISCLAIMER — NEVER HIDDEN */}
            {(text || isStreaming) && (
              <div className="answer-bubble-disclaimer" role="note" aria-label="Viktig information om AI-simulering">
                <span className="flex-shrink-0 text-base">⚠️</span>
                <span>
                  <strong>AI-simulerat svar</strong>, i stil med {party.displayName}, baserat på{" "}
                  {party.partyName}s valmanifest 2026.{" "}
                  <strong>Ej ett verkligt citat eller officiellt uttalande.</strong>
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
