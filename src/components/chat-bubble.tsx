"use client";

import { FileText, User } from "lucide-react";
import PartyAvatar from "@/components/party-avatar";
import StanceMeter from "@/components/stance-meter";
import type { Stance } from "@/lib/sources";
import type { PartyPersona } from "@/types/party";

interface ChatBubbleProps {
  party?: PartyPersona;
  isUser?: boolean;
  text: string;
  sources?: string[];
  stance?: Stance;
  isStreaming?: boolean;
  turnNumber: number;
}

/** One-shot chat bubble: the message reads first, the sender's name and icon sit underneath it. */
export default function ChatBubble({
  party,
  isUser = false,
  text,
  sources = [],
  stance,
  isStreaming = false,
  turnNumber,
}: ChatBubbleProps): React.JSX.Element {
  // User bubble (right-aligned)
  if (isUser || !party) {
    return (
      <div className="flex w-full justify-end" id={`chat-turn-${turnNumber}`}>
        <div className="flex max-w-[85%] flex-col items-end gap-1 md:max-w-[72%]">
          <div
            className="rounded-2xl rounded-se-xs border-2 border-black p-3.5 text-white shadow-[3px_3px_0px_#1a1a1a]"
            style={{ backgroundColor: "#4338ca" }}
          >
            <p className="whitespace-pre-wrap font-bold text-sm leading-relaxed md:text-base">{text}</p>
          </div>

          <div className="flex items-center gap-1.5 px-1 font-black text-gray-400 text-xs">
            <span>Du</span>
            <User className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // Party bubble (left-aligned)
  return (
    <div className="flex w-full justify-start" id={`chat-turn-${turnNumber}`}>
      <div className="flex max-w-[88%] flex-col items-start gap-1 md:max-w-[76%]">
        <div className="w-full overflow-hidden rounded-2xl rounded-ss-xs border-2 border-black bg-white shadow-[3px_3px_0px_#1a1a1a]">
          {/* Party color accent stripe */}
          <div className="h-1.5 w-full" style={{ backgroundColor: party.color }} />

          <div className="p-3.5">
            {isStreaming && !text ? (
              <span className="typing-dots" style={{ color: party.color }}>
                <span />
                <span />
                <span />
              </span>
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
                    {sources.map((source) => (
                      <div className="answer-bubble-source text-xs" key={source}>
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{source}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Name and icon, under the bubble */}
        <div className="flex items-center gap-1.5 px-1 font-black text-xs">
          <PartyAvatar
            badgeClassName="absolute -bottom-0.5 -end-0.5 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5"
            badgeSize={12}
            className="relative overflow-hidden rounded-full border border-black"
            party={party}
            size={22}
            style={{ backgroundColor: party.color }}
          />
          <span style={{ color: party.color }}>{party.displayName}</span>
          <span className="font-bold text-gray-500">({party.abbreviation})</span>
        </div>
      </div>
    </div>
  );
}
