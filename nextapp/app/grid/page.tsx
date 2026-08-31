"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PARTIES } from "@/lib/parties";
import AnswerBubble from "@/components/AnswerBubble";
import QuestionInput from "@/components/QuestionInput";
import AppNav from "@/components/AppNav";

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

  const handleAskAll = async () => {
    if (!question.trim()) return;

    // Reset state
    const initial: Record<string, PartyAnswer> = {};
    PARTIES.forEach((p) => {
      initial[p.id] = { partyId: p.id, text: "", sources: [], isDone: false, hasError: false };
    });
    setAnswers(initial);
    setIsLoading(true);
    setAllDone(false);

    try {
      const res = await fetch("/api/ask-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.body) throw new Error("Inget svar från servern");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "answer") {
                setAnswers((prev) => ({
                  ...prev,
                  [data.partyId]: {
                    partyId: data.partyId,
                    text: data.text,
                    sources: data.sources || [],
                    isDone: true,
                    hasError: false,
                  },
                }));
              } else if (data.type === "error") {
                setAnswers((prev) => ({
                  ...prev,
                  [data.partyId]: {
                    ...prev[data.partyId],
                    text: data.text,
                    isDone: true,
                    hasError: true,
                  },
                }));
              } else if (data.type === "done") {
                setAllDone(true);
                setIsLoading(false);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger if question came from URL
  useEffect(() => {
    if (initialQ) {
      handleAskAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answeredCount = Object.values(answers).filter((a) => a.isDone).length;
  const hasStarted = Object.keys(answers).length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-black text-3xl text-black mb-2 flex items-center justify-center gap-3">
            <span>🔲</span>
            Alla partier svarar
          </h1>
          <p className="text-gray-600 font-semibold">
            Ställ en fråga – alla 8 partiledare svarar parallellt
          </p>
        </div>

        {/* Question input */}
        <div className="cartoon-card p-5 mb-8 max-w-2xl mx-auto">
          <QuestionInput
            value={question}
            onChange={setQuestion}
            onSubmit={handleAskAll}
            isLoading={isLoading}
            placeholder="Vad tycker partierna om sjukvården?"
            buttonLabel="Fråga alla 8! 🔲"
            id="grid-question-input"
          />

          {hasStarted && isLoading && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3 border-2 border-black overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(answeredCount / 8) * 100}%`,
                    backgroundColor: "var(--color-ink)",
                  }}
                />
              </div>
              <span className="text-sm font-black text-gray-600 flex-shrink-0">
                {answeredCount}/8 klara
              </span>
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
                    key={party.id}
                    party={party}
                    text={answer?.text ?? ""}
                    sources={answer?.sources ?? []}
                    isStreaming={!answer?.isDone}
                    isEmpty={!answer?.text && !answer?.isDone}
                    compact
                  />
                );
              })}
            </div>

            {allDone && (
              <div
                className="text-center p-4 rounded-xl border-2 font-bold text-sm"
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
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">🔲</div>
            <p className="font-bold text-lg">
              Skriv en fråga ovan och klicka på &quot;Fråga alla 8!&quot;
            </p>
            <p className="text-sm mt-2">
              Alla åtta riksdagspartiers AI-simuleringar svarar parallellt
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GridPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="typing-dots"><span /><span /><span /></div>
    </div>}>
      <GridContent />
    </Suspense>
  );
}
