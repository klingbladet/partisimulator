"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppNav from "@/components/shared/app-nav";
import PageContainer from "@/components/shared/page-container";
import RegenerateButton from "@/components/shared/regenerate-button";
import SiteFooter from "@/components/shared/site-footer";
import TypingDots from "@/components/shared/typing-dots";
import { streamAbout } from "@/lib/stream-about";
import type { AboutBeatEvent } from "@/types/stream";

interface StorySection {
  heading: string;
  text: string;
}

interface CastEntry {
  name: string;
  bio: string;
}

// Tracks which card should show its own loading dots - the server has no parallelism between
// these two phases (cast entries all finish before the first beat starts), so the UI shouldn't
// either: only one card is ever "the one still generating" at a time.
type Phase = "idle" | "cast" | "story";

// Shown instead of an empty story card when every beat failed or came back empty - stays in
// character rather than leaving a blank white box with no explanation.
const STORY_FALLBACK_TEXT =
  "Just nu är det inte möjligt att berätta hur allt började, men du kan lita på att det var helt sjukt episkt!";

export default function AboutPage(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>("idle");
  const [castEntries, setCastEntries] = useState<CastEntry[]>([]);
  const [sections, setSections] = useState<StorySection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleEvent = useCallback((event: AboutBeatEvent) => {
    if (event.type === "cast" && event.name && event.text) {
      const name = event.name;
      const bio = event.text;
      setCastEntries((prev) => [...prev, { bio, name }]);
      return;
    }
    if (event.type === "castDone") {
      setPhase("story");
      return;
    }
    if (event.type === "beat" && event.heading && event.text) {
      const heading = event.heading;
      const text = event.text;
      setSections((prev) => [...prev, { heading, text }]);
      return;
    }
    if (event.type === "done") {
      setIsLoading(false);
    }
  }, []);

  const handleTellStory = useCallback(async () => {
    setPhase("cast");
    setCastEntries([]);
    setSections([]);
    setError(undefined);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await streamAbout(handleEvent, abortController.signal);
    } catch (err) {
      if (!abortController.signal.aborted) {
        setError(err instanceof Error ? err.message : "Något gick fel");
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleEvent]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  // Abort an in-flight story stream when the user navigates away - otherwise it keeps running
  // server-side with nothing left to render it.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <PageContainer className="px-4 py-8">
        <section className="mb-10 text-center">
          <h1 className="font-black text-4xl text-[var(--color-ink)] leading-tight">Vår historia</h1>
          <p className="mt-2 font-semibold text-gray-600">
            Alla har sin historia värd att berätta. Vår är unik varje gång.
          </p>

          <button
            className={`mt-6 inline-flex items-center gap-2 rounded-full border-[3px] border-[var(--color-ink)] px-6 py-3 font-black text-white shadow-[4px_4px_0px_var(--color-ink)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-ink)] active:translate-y-0 active:shadow-[2px_2px_0px_var(--color-ink)] ${isLoading ? "bg-[#ff4444]" : "bg-[var(--color-success)]"}`}
            onClick={isLoading ? handleStop : handleTellStory}
            type="button"
          >
            {isLoading ? "Stopp" : "Berätta vår historia"}
          </button>
        </section>

        {(castEntries.length > 0 || phase === "cast") && (
          <div className="cartoon-card mb-6 p-6">
            <h2 className="font-black text-[var(--color-ink)] text-xl leading-tight">I rollerna</h2>
            <div className="mt-4 flex flex-col gap-5">
              {castEntries.map((entry) => (
                <div key={entry.name}>
                  <p className="font-black text-[var(--color-ink)]">{entry.name}</p>
                  <p className="mt-1 font-semibold text-gray-700">{entry.bio}</p>
                </div>
              ))}
              {isLoading && phase === "cast" && (
                <TypingDots ariaLabel="Hittar på rollerna" className="typing-dots" color="var(--color-ink)" />
              )}
            </div>
          </div>
        )}

        {(sections.length > 0 || phase === "story") && (
          <div className="cartoon-card p-6">
            {sections.length === 0 && !isLoading ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-gray-700">{STORY_FALLBACK_TEXT}</p>
                <RegenerateButton onClick={handleTellStory} />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {sections.map((section, index) => (
                  <div key={section.heading}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-orange-600 text-sm">{String(index + 1).padStart(2, "0")}</span>
                      <h3 className="font-black text-2xl text-[var(--color-ink)] leading-tight">{section.heading}</h3>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap font-semibold text-gray-700">{section.text}</p>
                  </div>
                ))}
                {isLoading && phase === "story" && (
                  <TypingDots ariaLabel="Hittar på mer" className="typing-dots" color="var(--color-ink)" />
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="cartoon-card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="font-bold text-red-700">Något gick fel: {error}</p>
            <RegenerateButton onClick={handleTellStory} />
          </div>
        )}
      </PageContainer>

      <SiteFooter />
    </div>
  );
}
