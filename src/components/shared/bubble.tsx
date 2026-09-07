"use client";

import { Mic, User } from "lucide-react";
import PartyAvatar from "@/components/shared/party-avatar";
import SourcesList from "@/components/shared/sources-list";
import StanceMeter from "@/components/shared/stance-meter";
import TypingDots from "@/components/shared/typing-dots";
import type { Stance } from "@/lib/sources";
import type { PartyPersona } from "@/types/party";

interface BubbleProps {
  variant: "chat" | "debate";
  party?: PartyPersona;
  isUser?: boolean;
  /** Debate variant only: overrides the default "Du (Debattledare)" label for the moderator bubble. */
  speakerName?: string;
  text: string;
  sources?: string[];
  stance?: Stance;
  isStreaming?: boolean;
  turnNumber: number;
}

export default function Bubble({
  variant,
  party,
  isUser = false,
  speakerName,
  text,
  sources = [],
  stance,
  isStreaming = false,
  turnNumber,
}: BubbleProps): React.JSX.Element {
  const idPrefix = variant === "debate" ? "debate-turn" : "chat-turn";

  const body =
    isStreaming && !text && party ? (
      <TypingDots color={party.color} />
    ) : (
      <>
        {stance && (
          <div className="mb-1.5">
            <StanceMeter stance={stance} />
          </div>
        )}

        <p
          className={`whitespace-pre-wrap font-semibold text-gray-800 text-sm leading-relaxed md:text-base ${isStreaming ? "streaming-cursor" : ""}`}
        >
          {text}
        </p>

        {sources.length > 0 && (
          <div className="mt-2.5 space-y-1 border-gray-100 border-t pt-2">
            <SourcesList className="answer-bubble-source text-xs" sources={sources} />
          </div>
        )}
      </>
    );

  // User / moderator bubble (right-aligned), name row below the bubble
  if (isUser || !party) {
    return (
      <div className="flex w-full justify-end" id={`${idPrefix}-${turnNumber}`}>
        <div className="flex max-w-[85%] flex-col items-end gap-2.5 md:max-w-[72%]">
          <div
            className="rounded-2xl rounded-ee-xs border-2 border-black p-3.5 text-white shadow-[var(--shadow-btn)]"
            style={{ backgroundColor: "var(--color-user)" }}
          >
            <p className="whitespace-pre-wrap font-bold text-sm leading-relaxed md:text-base">{text}</p>
          </div>

          <div className="flex items-center gap-1.5 px-1 font-black text-xs">
            <span
              className="flex items-center justify-center rounded-full border border-black text-white"
              style={{ backgroundColor: "var(--color-user)", height: 22, width: 22 }}
            >
              {variant === "debate" ? <Mic className="h-3 w-3" /> : <User className="h-3 w-3" />}
            </span>
            <span style={{ color: "var(--color-user)" }}>
              {variant === "debate" ? speakerName || "Du (Debattledare)" : "Du"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Party bubble (left-aligned), avatar and name below the bubble
  return (
    <div className="flex w-full justify-start" id={`${idPrefix}-${turnNumber}`}>
      <div className="flex max-w-[88%] flex-col items-start gap-2.5 md:max-w-[76%]">
        <div className="w-full overflow-hidden rounded-2xl rounded-es-xs border-2 border-black bg-white shadow-[var(--shadow-btn)]">
          <div className="h-1.5 w-full" style={{ backgroundColor: party.color }} />
          <div className="p-3.5">{body}</div>
        </div>

        <div className="flex items-center gap-1.5 px-1 font-black text-xs">
          <PartyAvatar
            badgeClassName="absolute -bottom-1 -end-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5"
            className="relative overflow-hidden rounded-full border border-black"
            party={party}
            size={22}
            style={{ backgroundColor: "var(--color-user)" }}
          />
          <span style={{ color: party.color }}>{party.displayName}</span>
          <span className="font-bold text-gray-500">({party.abbreviation})</span>
        </div>
      </div>
    </div>
  );
}
