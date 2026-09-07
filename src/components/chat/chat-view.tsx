"use client";

import { Lightbulb, Send, Square } from "lucide-react";
import type { RefObject } from "react";
import Bubble from "@/components/shared/bubble";
import PartyAvatar from "@/components/shared/party-avatar";
import type { Stance } from "@/lib/sources";
import type { ChatMessage } from "@/types/chat";
import type { PartyPersona } from "@/types/party";

interface ChatViewProps {
  selectedParty: PartyPersona | null;
  chatHistory: ChatMessage[];
  pendingStance: Stance | undefined;
  pendingText: string;
  isLoading: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  followUpQuestion: string;
  onFollowUpChange: (value: string) => void;
  onSendFollowUp: () => void;
  onStop: () => void;
}

export default function ChatView({
  selectedParty,
  chatHistory,
  pendingStance,
  pendingText,
  isLoading,
  chatEndRef,
  followUpQuestion,
  onFollowUpChange,
  onSendFollowUp,
  onStop,
}: ChatViewProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* Active question + party banner, matching the question strip on Alla partier and Debatt */}
      {selectedParty && (
        <div className="cartoon-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Lightbulb aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <span className="line-clamp-2 font-black text-gray-800 sm:line-clamp-1">
              &quot;{chatHistory.find((message) => message.role === "user")?.text}&quot;
            </span>
          </div>

          <div title={`${selectedParty.displayName} (${selectedParty.partyName})`}>
            <PartyAvatar
              badgeClassName="absolute -bottom-1 -end-1 rounded-full bg-white border-2 border-black overflow-hidden flex items-center justify-center p-0.5 shadow-sm"
              className="relative overflow-hidden rounded-full border-2"
              party={selectedParty}
              size={40}
              style={{ backgroundColor: selectedParty.color, borderColor: "var(--border)" }}
            />
          </div>
        </div>
      )}

      {/* Chat Transcript Window */}
      <div
        className="cartoon-card flex max-h-[65vh] min-h-80 flex-col gap-4 overflow-y-auto border-3 p-4 md:p-6"
        id="chat-transcript"
        style={{ backgroundColor: "var(--color-cream)" }}
      >
        {chatHistory.map((message, index) => {
          if (message.role === "user") {
            return <Bubble isUser={true} key={message.id} text={message.text} turnNumber={index + 1} variant="chat" />;
          }

          if (!selectedParty) {
            return null;
          }

          return (
            <Bubble
              isStreaming={false}
              key={message.id}
              manifestUrl={message.manifestUrl}
              party={selectedParty}
              sources={message.sources}
              stance={message.stance}
              text={message.text}
              turnNumber={index + 1}
              variant="chat"
            />
          );
        })}

        {/* Streaming reply */}
        {isLoading && selectedParty && (
          <Bubble
            isStreaming={true}
            party={selectedParty}
            stance={pendingStance}
            text={pendingText}
            turnNumber={chatHistory.length + 1}
            variant="chat"
          />
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Compact Follow-up Input Bar */}
      <div className="flex flex-col gap-2">
        <input
          className="cartoon-input bg-white text-sm"
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
        {isLoading ? (
          <button
            className="cartoon-btn cartoon-btn-danger text-sm"
            id="followup-question-stop"
            onClick={onStop}
            style={{ inlineSize: "100%" }}
            type="button"
          >
            <Square aria-hidden="true" className="h-4 w-4" fill="currentColor" />
            Avbryt
          </button>
        ) : (
          <button
            className="cartoon-btn cartoon-btn-primary text-sm"
            disabled={!followUpQuestion.trim()}
            id="followup-question-submit"
            onClick={onSendFollowUp}
            style={{ inlineSize: "100%" }}
            type="button"
          >
            <Send aria-hidden="true" className="h-4 w-4" />
            Skicka
          </button>
        )}
      </div>
    </div>
  );
}
