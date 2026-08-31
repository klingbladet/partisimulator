"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import Image from "next/image";
import { PARTIES, PartyPersona } from "@/lib/parties";
import PartyChip from "@/components/PartyChip";
import QuestionInput from "@/components/QuestionInput";
import { DebateBubble } from "@/components/DebateComponents";
import AppNav from "@/components/AppNav";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

function extractSources(text: string): string[] {
  const matches = text.match(/\[KÄLLA:[^\]]+\]/g);
  return matches || [];
}

function cleanText(text: string): string {
  return text.replace(/\[KÄLLA:[^\]]+\]/g, "").trim();
}

export default function HomePage() {
  const router = useRouter();
  const [selectedParty, setSelectedParty] = useState<PartyPersona | null>(null);
  const [question, setQuestion] = useState("");
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [pendingText, setPendingText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activePartyRef = useRef<PartyPersona | null>(null);

  const addAssistantMessage = (rawText: string) => {
    const cleaned = cleanText(rawText);
    if (!cleaned) return;
    const sources = extractSources(rawText);

    setChatHistory((prev) => {
      // Prevent duplicate entry if both onFinish and complete return
      const last = prev[prev.length - 1];
      if (last && last.role === "assistant" && last.text === cleaned) {
        return prev;
      }
      return [
        ...prev,
        {
          role: "assistant",
          text: cleaned,
          sources,
        },
      ];
    });
    setPendingText("");
  };

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/ask",
    streamProtocol: "text",
    onFinish: (_, comp) => {
      if (comp) {
        addAssistantMessage(comp);
      }
    },
  });

  // Stream live text into pendingText
  useEffect(() => {
    if (isLoading && completion) {
      setPendingText(cleanText(completion));
    }
  }, [completion, isLoading]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, pendingText]);

  // Send a question (either initial or follow-up)
  const handleSendQuestion = async (textToSend: string) => {
    if (!selectedParty || !textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    setQuestion("");
    setFollowUpQuestion("");

    // Add user message to history
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", text: userText },
    ];
    setChatHistory(updatedHistory);
    activePartyRef.current = selectedParty;

    // Send to API with full conversation context
    const apiHistory = chatHistory.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    const result = await complete(userText, {
      body: {
        partyId: selectedParty.id,
        question: userText,
        history: apiHistory,
      },
    });

    if (result) {
      addAssistantMessage(result);
    }
  };

  const handleAllParties = () => {
    if (!question.trim()) return;
    router.push(`/grid?q=${encodeURIComponent(question)}`);
  };

  const handleResetConversation = () => {
    setChatHistory([]);
    setPendingText("");
    setQuestion("");
    setFollowUpQuestion("");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-5xl">🗳️</span>
            <div className="text-left">
              <h1 className="font-black text-4xl text-black leading-tight">
                PartiSimulator
              </h1>
              <p className="font-bold text-lg text-gray-500">Valet 2026</p>
            </div>
          </div>
          <p className="text-gray-600 font-semibold max-w-xl mx-auto">
            Välj ett parti och starta en dialog – ställ din fråga och fortsätt med följdfrågor!
            Svaren baseras på partiernas valmanifest och ideologi.
          </p>
          <div
            className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full border-2 text-xs font-bold"
            style={{
              backgroundColor: "#fff3cd",
              borderColor: "#f0a500",
              color: "#7a4f00",
            }}
          >
            <span>⚠️</span>
            <span>AI-simulering – ej verkliga citat från partiledarna</span>
          </div>
        </div>

        {/* View 1: Initial Question Form (when no chat has started yet) */}
        {chatHistory.length === 0 && !isLoading ? (
          <div className="space-y-6">
            {/* Party selection */}
            <section className="cartoon-card p-6">
              <h2 className="font-black text-lg mb-4 flex items-center gap-2">
                <span>🎯</span>
                <span>Steg 1: Välj parti att samtala med</span>
              </h2>

              <div className="party-grid">
                {PARTIES.map((party) => (
                  <PartyChip
                    key={party.id}
                    party={party}
                    selected={selectedParty?.id === party.id}
                    onClick={() =>
                      setSelectedParty(selectedParty?.id === party.id ? null : party)
                    }
                    size="md"
                  />
                ))}
              </div>

              {selectedParty && (
                <div
                  className="mt-4 p-3 rounded-xl border-2 text-sm font-semibold animate-in"
                  style={{
                    backgroundColor: selectedParty.color + "15",
                    borderColor: selectedParty.color,
                    color: "var(--color-ink)",
                  }}
                >
                  <strong style={{ color: selectedParty.color }}>
                    {selectedParty.displayName}
                  </strong>{" "}
                  ({selectedParty.partyName}) är vald.{" "}
                  <span className="text-gray-500">
                    Hjärtefrågor: {selectedParty.keyIssues.join(", ")}
                  </span>
                </div>
              )}
            </section>

            {/* Question input */}
            <section className="cartoon-card p-6">
              <h2 className="font-black text-lg mb-4 flex items-center gap-2">
                <span>💬</span>
                <span>Steg 2: Skriv din fråga</span>
              </h2>

              <QuestionInput
                value={question}
                onChange={setQuestion}
                onSubmit={() => handleSendQuestion(question)}
                disabled={!selectedParty}
                isLoading={isLoading}
                placeholder={
                  selectedParty
                    ? `Fråga ${selectedParty.displayName}...`
                    : "Välj ett parti ovan först..."
                }
                buttonLabel={`Fråga ${selectedParty?.abbreviation ?? "partiet"}! 🎤`}
                id="direct-question-input"
              />

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                <span className="text-sm font-bold text-gray-400">eller</span>
                <div className="flex-1 border-t-2 border-dashed border-gray-200" />
              </div>

              <button
                className="cartoon-btn cartoon-btn-ghost w-full mt-3"
                onClick={handleAllParties}
                disabled={!question.trim() || isLoading}
                id="ask-all-btn"
              >
                🔲 Fråga alla 8 partier på en gång!
              </button>
            </section>
          </div>
        ) : (
          /* View 2: Ongoing Chat Dialog */
          <div className="space-y-4">
            {/* Active Party Header Banner */}
            {selectedParty && (
              <div
                className="cartoon-card p-4 flex items-center justify-between flex-wrap gap-3"
                style={{ backgroundColor: "#1a1a1a", color: "white" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="relative rounded-full overflow-hidden border-2 border-white flex-shrink-0"
                    style={{ width: 44, height: 44, backgroundColor: selectedParty.color }}
                  >
                    <Image
                      src={`/avatars/${selectedParty.avatarFile}`}
                      alt={selectedParty.displayName}
                      fill
                      className="object-cover object-top"
                      sizes="44px"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-white">
                        {selectedParty.displayName}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-black"
                        style={{
                          backgroundColor: selectedParty.color,
                          color: selectedParty.textColor,
                        }}
                      >
                        {selectedParty.abbreviation}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 font-semibold">
                      {selectedParty.partyName} · {selectedParty.keyIssues.join(", ")}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleResetConversation}
                  disabled={isLoading}
                  className="cartoon-btn cartoon-btn-ghost text-xs py-1.5 px-3 bg-white text-black hover:bg-gray-100"
                  id="reset-chat-btn"
                >
                  🔄 Byt parti / Ny fråga
                </button>
              </div>
            )}

            {/* Chat Transcript Window */}
            <div
              className="cartoon-card p-4 md:p-6 min-h-80 max-h-[65vh] overflow-y-auto flex flex-col gap-4 border-3"
              style={{ backgroundColor: "#fbf9f4" }}
              id="chat-transcript"
            >
              {chatHistory.map((msg, i) => {
                if (msg.role === "user") {
                  return (
                    <DebateBubble
                      key={i}
                      isUser={true}
                      speakerName="Du"
                      text={msg.text}
                      turnNumber={i + 1}
                    />
                  );
                }

                return (
                  <DebateBubble
                    key={i}
                    party={selectedParty!}
                    text={msg.text}
                    sources={msg.sources}
                    isStreaming={false}
                    turnNumber={i + 1}
                  />
                );
              })}

              {/* Streaming reply */}
              {isLoading && selectedParty && (
                <DebateBubble
                  party={selectedParty}
                  text={pendingText}
                  isStreaming={true}
                  turnNumber={chatHistory.length + 1}
                />
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Compact Follow-up Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                className="cartoon-input flex-1 text-sm bg-white"
                placeholder={
                  selectedParty
                    ? `Ställ en följdfråga till ${selectedParty.displayName}...`
                    : "Skriv din följdfråga..."
                }
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuestion(followUpQuestion);
                  }
                }}
                disabled={isLoading}
                id="followup-question-input"
              />
              <button
                onClick={() => handleSendQuestion(followUpQuestion)}
                disabled={!followUpQuestion.trim() || isLoading}
                className="cartoon-btn cartoon-btn-primary whitespace-nowrap text-sm px-5"
                id="followup-question-submit"
              >
                💬 Skicka
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="cartoon-card p-4 mt-6 border-red-400"
            style={{ borderColor: "#f44336", backgroundColor: "#fff5f5" }}
          >
            <p className="font-bold text-red-700">
              ❌ Något gick fel: {error.message}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="mt-16 border-t-3 py-6 text-center"
        style={{ borderTop: "3px solid var(--color-ink)" }}
      >
        <p className="text-sm font-semibold text-gray-500">
          🤖 PartiSimulator 2026 – AI-simulering baserad på valmanifest. Ej officiell.
        </p>
      </footer>
    </div>
  );
}
