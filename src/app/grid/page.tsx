"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import AnswerBubble from "@/components/grid/answer-bubble";
import AppNav from "@/components/shared/app-nav";
import PageContainer from "@/components/shared/page-container";
import QuestionInput from "@/components/shared/question-input";
import SiteFooter from "@/components/shared/site-footer";
import TypingDots from "@/components/shared/typing-dots";
import { PARTIES } from "@/lib/parties";
import type { Stance } from "@/lib/sources";
import { streamAskAll } from "@/lib/stream-ask-all";
import type { AskAllEvent } from "@/types/stream";

interface PartyAnswer {
  partyId: string;
  text: string;
  longAnswer?: string;
  sources: string[];
  stance?: Stance;
  isDone: boolean;
  hasError: boolean;
}

function GridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [question, setQuestion] = useState(initialQ);
  const [answers, setAnswers] = useState<Record<string, PartyAnswer>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAskAllEvent = useCallback((event: AskAllEvent) => {
    if (event.type === "answer" && event.partyId) {
      const partyId = event.partyId;
      setAnswers((prev) => ({
        ...prev,
        [partyId]: {
          hasError: false,
          isDone: true,
          longAnswer: event.longAnswer,
          partyId,
          sources: event.sources ?? [],
          stance: event.stance,
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

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await streamAskAll(question, handleAskAllEvent, abortController.signal);
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [question, handleAskAllEvent]);

  // Cancel every still-running party stream: whatever partial text each one has already
  // received stays on screen, marked done, instead of being discarded.
  const handleStopAll = (): void => {
    abortControllerRef.current?.abort();
    setAnswers((prev) => {
      const next: Record<string, PartyAnswer> = {};
      for (const [partyId, answer] of Object.entries(prev)) {
        next[partyId] = answer.isDone ? answer : { ...answer, isDone: true };
      }
      return next;
    });
  };

  // Abort any in-flight party streams when the user navigates away — otherwise they keep running
  // server-side with nothing left to render them.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <PageContainer className="px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-black text-3xl text-[var(--color-ink)] leading-tight">Alla partier</h1>
          <p className="mt-1 font-semibold text-gray-600">
            Ställ en fråga och se hur alla åtta riksdagspartier svarar parallellt.
          </p>
        </div>

        {/* Question input */}
        <div className="cartoon-card mb-8 p-5">
          <QuestionInput
            buttonLabel="Fråga alla 8!"
            id="grid-question-input"
            isLoading={isLoading}
            onChange={setQuestion}
            onStop={handleStopAll}
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

          {allDone && (
            <div className="status-banner-success mt-3 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Alla 8 partier har svarat! Fråga gärna något annat.
            </div>
          )}
        </div>

        {/* Grid of answers */}
        {hasStarted && (
          <div className="grid-answers mb-4">
            {PARTIES.map((party) => {
              const answer = answers[party.id];
              return (
                <AnswerBubble
                  compact
                  isEmpty={!answer?.text && !answer?.isDone}
                  isStreaming={!answer?.isDone}
                  key={party.id}
                  longAnswer={answer?.longAnswer}
                  onContinueChat={
                    answer?.isDone && !answer.hasError
                      ? () => {
                          const seedAnswer = answer.longAnswer ?? answer.text;
                          router.push(
                            `/?party=${party.id}&q=${encodeURIComponent(question)}&a=${encodeURIComponent(seedAnswer)}`,
                          );
                        }
                      : undefined
                  }
                  party={party}
                  sources={answer?.sources ?? []}
                  stance={answer?.stance}
                  text={answer?.text ?? ""}
                />
              );
            })}
          </div>
        )}
      </PageContainer>

      <SiteFooter />
    </div>
  );
}

export default function GridPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <TypingDots />
        </div>
      }
    >
      <GridContent />
    </Suspense>
  );
}
