"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import AnswerBubble from "@/components/answer-bubble";
import AppNav from "@/components/app-nav";
import QuestionInput from "@/components/question-input";
import { PARTIES } from "@/lib/parties";
import { streamAskAll } from "@/lib/stream-ask-all";
import type { AskAllEvent } from "@/types/stream";

interface PartyAnswer {
  partyId: string;
  text: string;
  sources: string[];
  isDone: boolean;
  hasError: boolean;
}

function GridContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [question, setQuestion] = useState(initialQ);
  const [answers, setAnswers] = useState<Record<string, PartyAnswer>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const handleAskAllEvent = useCallback((event: AskAllEvent) => {
    if (event.type === "answer" && event.partyId) {
      const partyId = event.partyId;
      setAnswers((prev) => ({
        ...prev,
        [partyId]: {
          hasError: false,
          isDone: true,
          partyId,
          sources: event.sources ?? [],
          text: event.text ?? "",
        },
      }));
      return;
    }

    if (event.type === "error" && event.partyId) {
      const partyId = event.partyId;
      setAnswers((prev) => ({
        ...prev,
        [partyId]: {
          hasError: true,
          isDone: true,
          partyId,
          sources: prev[partyId]?.sources ?? [],
          text: event.text ?? "",
        },
      }));
      return;
    }

    if (event.type === "done") {
      setAllDone(true);
      setIsLoading(false);
    }
  }, []);

  const handleAskAll = useCallback(async () => {
    if (!question.trim()) return;

    // Reset state
    const initial: Record<string, PartyAnswer> = {};
    PARTIES.forEach((party) => {
      initial[party.id] = { hasError: false, isDone: false, partyId: party.id, sources: [], text: "" };
    });
    setAnswers(initial);
    setIsLoading(true);
    setAllDone(false);

    try {
      await streamAskAll(question, handleAskAllEvent);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [question, handleAskAllEvent]);

  // Auto-trigger once if the question came from the URL
  const hasAutoTriggered = useRef(false);
  useEffect(() => {
    if (initialQ && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      handleAskAll();
    }
  }, [initialQ, handleAskAll]);

  const answeredCount = Object.values(answers).filter((answer) => answer.isDone).length;
  const hasStarted = Object.keys(answers).length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 flex items-center justify-center gap-3 font-black text-3xl text-black">
            <span>🔲</span>
            Alla partier svarar
          </h1>
          <p className="font-semibold text-gray-600">Ställ en fråga – alla 8 partiledare svarar parallellt</p>
        </div>

        {/* Question input */}
        <div className="cartoon-card mx-auto mb-8 max-w-2xl p-5">
          <QuestionInput
            buttonLabel="Fråga alla 8! 🔲"
            id="grid-question-input"
            isLoading={isLoading}
            onChange={setQuestion}
            onSubmit={handleAskAll}
            placeholder="Vad tycker partierna om sjukvården?"
            value={question}
          />

          {hasStarted && isLoading && (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-black bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    width: `${(answeredCount / 8) * 100}%`,
                  }}
                />
              </div>
              <span className="flex-shrink-0 font-black text-gray-600 text-sm">{answeredCount}/8 klara</span>
            </div>
          )}
        </div>

        {/* Grid of answers */}
        {hasStarted && (
          <>
            <div className="grid-answers mb-4">
              {PARTIES.map((party) => {
                const answer = answers[party.id];
                return (
                  <AnswerBubble
                    compact
                    isEmpty={!answer?.text && !answer?.isDone}
                    isStreaming={!answer?.isDone}
                    key={party.id}
                    party={party}
                    sources={answer?.sources ?? []}
                    text={answer?.text ?? ""}
                  />
                );
              })}
            </div>

            {allDone && (
              <div
                className="rounded-xl border-2 p-4 text-center font-bold text-sm"
                style={{
                  backgroundColor: "#f0fff4",
                  borderColor: "#22c55e",
                  color: "#15803d",
                }}
              >
                ✅ Alla 8 partier har svarat! Fråga gärna något annat.
              </div>
            )}
          </>
        )}

        {!hasStarted && (
          <div className="py-16 text-center text-gray-400">
            <div className="mb-4 text-6xl">🔲</div>
            <p className="font-bold text-lg">Skriv en fråga ovan och klicka på &quot;Fråga alla 8!&quot;</p>
            <p className="mt-2 text-sm">Alla åtta riksdagspartiers AI-simuleringar svarar parallellt</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GridPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="typing-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      }
    >
      <GridContent />
    </Suspense>
  );
}
