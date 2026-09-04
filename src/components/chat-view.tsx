"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { DebateBubble } from "@/components/debate-components";
import PartyAvatar from "@/components/party-avatar";
import type { ChatMessage } from "@/types/chat";
import type { PartyPersona } from "@/types/party";

interface ChatViewProps {
  selectedParty: PartyPersona | null;
  chatHistory: ChatMessage[];
  pendingText: string;
  isLoading: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  followUpQuestion: string;
  onFollowUpChange: (value: string) => void;
  onSendFollowUp: () => void;
  onReset: () => void;
}

export default function ChatView({
  selectedParty,
  chatHistory,
  pendingText,
  isLoading,
  chatEndRef,
  followUpQuestion,
  onFollowUpChange,
  onSendFollowUp,
  onReset,
}: ChatViewProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* Active Party Header Banner */}
      {selectedParty && (
        <div
          className="cartoon-card flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ backgroundColor: "#1a1a1a", color: "white" }}
        >
          <div className="flex items-center gap-3">
            <PartyAvatar
              badgeClassName="absolute -bottom-1 -right-1 rounded-full bg-white border-2 border-black overflow-hidden flex items-center justify-center p-0.5 shadow-sm"
              badgeSize={22}
              className="relative overflow-hidden rounded-full border-2 border-white"
              party={selectedParty}
              size={46}
              style={{ backgroundColor: selectedParty.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white">{selectedParty.displayName}</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-black text-xs"
                  style={{
                    backgroundColor: selectedParty.color,
                    color: selectedParty.textColor,
                  }}
                >
                  {selectedParty.logoFile && (
                    <span className="relative inline-block h-3.5 w-3.5">
                      <Image
                        alt={selectedParty.partyName}
                        className="object-contain"
                        fill
                        sizes="14px"
                        src={`/assets/logos/${selectedParty.logoFile}`}
                      />
                    </span>
                  )}
                  <span>{selectedParty.abbreviation}</span>
                </span>
              </div>
              <div className="font-semibold text-gray-300 text-xs">
                {selectedParty.partyName} · {selectedParty.keyIssues.join(", ")}
              </div>
            </div>
          </div>

          <button
            className="cartoon-btn cartoon-btn-ghost bg-white px-3 py-1.5 text-black text-xs hover:bg-gray-100"
            disabled={isLoading}
            id="reset-chat-btn"
            onClick={onReset}
            type="button"
          >
            🔄 Byt parti / Ny fråga
          </button>
        </div>
      )}

      {/* Chat Transcript Window */}
      <div
        className="cartoon-card flex max-h-[65vh] min-h-80 flex-col gap-4 overflow-y-auto border-3 p-4 md:p-6"
        id="chat-transcript"
        style={{ backgroundColor: "#fbf9f4" }}
      >
        {chatHistory.map((message, index) => {
          if (message.role === "user") {
            return (
              <DebateBubble
                isUser={true}
                key={message.id}
                speakerName="Du"
                text={message.text}
                turnNumber={index + 1}
              />
            );
          }

          if (!selectedParty) {
            return null;
          }

          return (
            <DebateBubble
              isStreaming={false}
              key={message.id}
              party={selectedParty}
              sources={message.sources}
              text={message.text}
              turnNumber={index + 1}
            />
          );
        })}

        {/* Streaming reply */}
        {isLoading && selectedParty && (
          <DebateBubble
            isStreaming={true}
            party={selectedParty}
            text={pendingText}
            turnNumber={chatHistory.length + 1}
          />
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Compact Follow-up Input Bar */}
      <div className="flex gap-2">
        <input
          className="cartoon-input flex-1 bg-white text-sm"
          disabled={isLoading}
          id="followup-question-input"
          onChange={(event) => onFollowUpChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSendFollowUp();
            }
          }}
          placeholder={
            selectedParty ? `Ställ en följdfråga till ${selectedParty.displayName}...` : "Skriv din följdfråga..."
          }
          type="text"
          value={followUpQuestion}
        />
        <button
          className="cartoon-btn cartoon-btn-primary whitespace-nowrap px-5 text-sm"
          disabled={!followUpQuestion.trim() || isLoading}
          id="followup-question-submit"
          onClick={onSendFollowUp}
          type="button"
        >
          💬 Skicka
        </button>
      </div>
    </div>
  );
}
