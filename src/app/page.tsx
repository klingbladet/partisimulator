"use client";

import { XCircle } from "lucide-react";
import { Suspense } from "react";
import ChatView from "@/components/chat/chat-view";
import InitialQuestionForm from "@/components/chat/initial-question-form";
import AppNav from "@/components/shared/app-nav";
import PageContainer from "@/components/shared/page-container";
import SiteFooter from "@/components/shared/site-footer";
import TypingDots from "@/components/shared/typing-dots";
import { useChatConversation } from "@/hooks/use-chat-conversation";

function HomeContent(): React.JSX.Element {
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
    handleResetConversation,
    handleStop,
  } = useChatConversation();

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <PageContainer className="px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-black text-3xl text-black leading-tight">Direktfråga</h1>
          <p className="mt-1 font-semibold text-gray-600">
            Fråga ett enskilt parti hur de ställer sig i en eller flera frågor.
          </p>
        </div>

        {/* View 1: Initial Question Form (when no chat has started yet) */}
        {chatHistory.length === 0 && !isLoading ? (
          <InitialQuestionForm
            isLoading={isLoading}
            onQuestionChange={setQuestion}
            onSelectParty={setSelectedParty}
            onStop={handleStop}
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
            onStop={handleStop}
            pendingText={pendingText}
            selectedParty={selectedParty}
          />
        )}

        {/* Error state */}
        {error && (
          <div
            className="cartoon-card mt-6 flex items-center gap-2 border-red-400 p-4"
            style={{ backgroundColor: "#fff5f5", borderColor: "#f44336" }}
          >
            <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#b91c1c" }} />
            <p className="font-bold text-red-700">Något gick fel: {error.message}</p>
          </div>
        )}
      </PageContainer>

      <SiteFooter />
    </div>
  );
}

export default function HomePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <TypingDots />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
