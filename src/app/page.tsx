"use client";

import AppNav from "@/components/app-nav";
import ChatView from "@/components/chat-view";
import InitialQuestionForm from "@/components/initial-question-form";
import { useChatConversation } from "@/hooks/use-chat-conversation";

export default function HomePage(): React.JSX.Element {
  const {
    selectedParty,
    setSelectedParty,
    question,
    setQuestion,
    followUpQuestion,
    setFollowUpQuestion,
    chatHistory,
    pendingText,
    chatEndRef,
    isLoading,
    error,
    handleSendQuestion,
    handleAllParties,
    handleResetConversation,
  } = useChatConversation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-3">
            <span className="text-5xl">🗳️</span>
            <div className="text-left">
              <h1 className="font-black text-4xl text-black leading-tight">PartiSimulator</h1>
              <p className="font-bold text-gray-500 text-lg">Valet 2026</p>
            </div>
          </div>
          <p className="mx-auto max-w-xl font-semibold text-gray-600">
            Välj ett parti och starta en dialog – ställ din fråga och fortsätt med följdfrågor! Svaren baseras på
            partiernas valmanifest och ideologi.
          </p>
          <div
            className="mt-3 inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 font-bold text-xs"
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
          <InitialQuestionForm
            isLoading={isLoading}
            onAskAll={handleAllParties}
            onQuestionChange={setQuestion}
            onSelectParty={setSelectedParty}
            onSubmit={() => handleSendQuestion(question)}
            question={question}
            selectedParty={selectedParty}
          />
        ) : (
          /* View 2: Ongoing Chat Dialog */
          <ChatView
            chatEndRef={chatEndRef}
            chatHistory={chatHistory}
            followUpQuestion={followUpQuestion}
            isLoading={isLoading}
            onFollowUpChange={setFollowUpQuestion}
            onReset={handleResetConversation}
            onSendFollowUp={() => handleSendQuestion(followUpQuestion)}
            pendingText={pendingText}
            selectedParty={selectedParty}
          />
        )}

        {/* Error state */}
        {error && (
          <div
            className="cartoon-card mt-6 border-red-400 p-4"
            style={{ backgroundColor: "#fff5f5", borderColor: "#f44336" }}
          >
            <p className="font-bold text-red-700">❌ Något gick fel: {error.message}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t-3 py-6 text-center" style={{ borderTop: "3px solid var(--color-ink)" }}>
        <p className="font-semibold text-gray-500 text-sm">
          🤖 PartiSimulator 2026 – AI-simulering baserad på valmanifest. Ej officiell.
        </p>
      </footer>
    </div>
  );
}
