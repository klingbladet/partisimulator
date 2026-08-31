"use client";

import { useState, useRef, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import { PARTIES, PartyPersona } from "@/lib/parties";
import { DebateBubble, DebateSpeakerSelector } from "@/components/DebateComponents";
import AppNav from "@/components/AppNav";

interface DebateEntry {
  speakerId: string;
  speakerName: string;
  text: string;
  sources: string[];
}

function extractSources(text: string): string[] {
  return text.match(/\[KÄLLA:[^\]]+\]/g) || [];
}

function cleanText(text: string): string {
  return text.replace(/\[KÄLLA:[^\]]+\]/g, "").trim();
}

export default function DebattPage() {
  const [selectedParties, setSelectedParties] = useState<PartyPersona[]>([]);
  const [topic, setTopic] = useState("");
  const [debateStarted, setDebateStarted] = useState(false);
  const [debateFinished, setDebateFinished] = useState(false);
  const [history, setHistory] = useState<DebateEntry[]>([]);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const currentSpeakerRef = useRef<string | null>(null);
  const [pendingText, setPendingText] = useState("");
  const [userInterjection, setUserInterjection] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const addSpeechToHistory = (speakerId: string, rawText: string) => {
    const party = PARTIES.find((p) => p.id === speakerId);
    const cleaned = cleanText(rawText);
    if (!party || !cleaned) return;

    const sources = extractSources(rawText);
    setHistory((prev) => {
      // Prevent duplicate additions if both onFinish and complete return
      const last = prev[prev.length - 1];
      if (last && last.speakerId === speakerId && last.text === cleaned) {
        return prev;
      }
      return [
        ...prev,
        {
          speakerId,
          speakerName: party.displayName,
          text: cleaned,
          sources,
        },
      ];
    });
    setPendingText("");
    setCurrentSpeakerId(null);
    currentSpeakerRef.current = null;
  };

  const { completion, complete, isLoading } = useCompletion({
    api: "/api/debate",
    streamProtocol: "text",
    onFinish: (_, comp) => {
      const speaker = currentSpeakerRef.current;
      if (speaker && comp) {
        addSpeechToHistory(speaker, comp);
      }
    },
  });

  // Update pending text as completion streams
  useEffect(() => {
    if (isLoading && completion) {
      setPendingText(cleanText(completion));
    }
  }, [completion, isLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, pendingText]);

  const toggleParty = (party: PartyPersona) => {
    setSelectedParties((prev) =>
      prev.find((p) => p.id === party.id)
        ? prev.filter((p) => p.id !== party.id)
        : [...prev, party]
    );
  };

  const startDebate = () => {
    if (selectedParties.length < 2 || !topic.trim()) return;
    setDebateStarted(true);
    setHistory([]);
    setDebateFinished(false);
  };

  const handleUserInterjection = () => {
    if (!userInterjection.trim() || isLoading || debateFinished) return;
    const userEntry: DebateEntry = {
      speakerId: "user",
      speakerName: "Du (Debattledare)",
      text: userInterjection.trim(),
      sources: [],
    };
    setHistory((prev) => [...prev, userEntry]);
    setUserInterjection("");
  };

  const handleSelectSpeaker = async (partyId: string) => {
    if (isLoading || debateFinished) return;
    const party = PARTIES.find((p) => p.id === partyId);
    if (!party) return;

    let currentHistory = history;
    if (userInterjection.trim()) {
      const userEntry: DebateEntry = {
        speakerId: "user",
        speakerName: "Du (Debattledare)",
        text: userInterjection.trim(),
        sources: [],
      };
      currentHistory = [...history, userEntry];
      setHistory(currentHistory);
      setUserInterjection("");
    }

    currentSpeakerRef.current = partyId;
    setCurrentSpeakerId(partyId);

    const finalResult = await complete("", {
      body: {
        selectedParties: selectedParties.map((p) => p.id),
        topic,
        history: currentHistory,
        nextSpeakerId: partyId,
      },
    });

    if (finalResult) {
      addSpeechToHistory(partyId, finalResult);
    }
  };

  const endDebate = () => {
    setDebateFinished(true);
    setCurrentSpeakerId(null);
  };

  const resetDebate = () => {
    setDebateStarted(false);
    setDebateFinished(false);
    setHistory([]);
    setSelectedParties([]);
    setTopic("");
    setCurrentSpeakerId(null);
    setPendingText("");
    setUserInterjection("");
  };

  const currentSpeakerParty = currentSpeakerId
    ? PARTIES.find((p) => p.id === currentSpeakerId)
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-black text-3xl text-black mb-2 flex items-center justify-center gap-3">
            <span>🎤</span>
            Debattläge
          </h1>
          <p className="text-gray-600 font-semibold">
            Välj partier, sätt ämne, styr talarordningen själv
          </p>
        </div>

        {!debateStarted ? (
          /* Setup panel */
          <div className="space-y-6">
            {/* Party selector */}
            <section className="cartoon-card p-6">
              <h2 className="font-black text-lg mb-4 flex items-center gap-2">
                <span>🎭</span>
                <span>Välj debattörer (minst 2)</span>
              </h2>
              <div className="party-grid">
                {PARTIES.map((party) => (
                  <div
                    key={party.id}
                    className="flex flex-col items-center gap-1 cursor-pointer select-none"
                    onClick={() => toggleParty(party)}
                  >
                    <div
                      className="party-chip w-full"
                      style={{
                        backgroundColor: selectedParties.find((p) => p.id === party.id)
                          ? party.color
                          : "white",
                        borderColor: party.color,
                        boxShadow: selectedParties.find((p) => p.id === party.id)
                          ? `4px 4px 0px ${party.color}88`
                          : "3px 3px 0px #1a1a1a",
                        transform: selectedParties.find((p) => p.id === party.id)
                          ? "translate(-2px, -2px)"
                          : "none",
                      }}
                      aria-pressed={!!selectedParties.find((p) => p.id === party.id)}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[13px]" style={{ backgroundColor: party.color }} />
                      <div className="relative rounded-full overflow-hidden border-2 mt-1"
                        style={{
                          width: 56, height: 56,
                          borderColor: selectedParties.find((p) => p.id === party.id) ? "white" : "#1a1a1a"
                        }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/avatars/${party.avatarFile}`}
                          alt={party.displayName}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="text-center w-full">
                        <div className="font-black text-xs" style={{ color: selectedParties.find((p) => p.id === party.id) ? "white" : "#1a1a1a" }}>
                          {party.abbreviation}
                        </div>
                        <div className="font-semibold text-gray-400 leading-tight" style={{ fontSize: "0.6rem" }}>
                          {party.partyName}
                        </div>
                      </div>
                      {selectedParties.find((p) => p.id === party.id) && (
                        <div className="absolute top-2 right-2 text-white font-black text-xs bg-black rounded-full w-5 h-5 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedParties.length > 0 && (
                <div className="mt-3 text-sm font-bold text-gray-600">
                  Valda:{" "}
                  {selectedParties
                    .map((p) => p.displayName)
                    .join(", ")}
                </div>
              )}
            </section>

            {/* Topic input */}
            <section className="cartoon-card p-6">
              <h2 className="font-black text-lg mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>Debattämne</span>
              </h2>
              <input
                className="cartoon-input"
                type="text"
                placeholder="T.ex. 'Hur ska Sverige bekämpa brottsligheten?'"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startDebate()}
                id="debate-topic-input"
              />
            </section>

            {/* Start button */}
            <button
              className="cartoon-btn cartoon-btn-primary w-full text-lg py-4"
              onClick={startDebate}
              disabled={selectedParties.length < 2 || !topic.trim()}
              id="start-debate-btn"
            >
              {selectedParties.length < 2
                ? "Välj minst 2 partier..."
                : `🎤 Starta debatten om "${topic || "..."}"`}
            </button>
          </div>
        ) : (
          /* Debate view */
          <div className="space-y-4">
            {/* Debate topic banner */}
            <div
              className="cartoon-card p-4 flex items-center justify-between"
              style={{ backgroundColor: "var(--color-ink)", color: "white" }}
            >
              <div>
                <div className="text-xs font-bold opacity-60 uppercase tracking-wide">
                  Debattämne
                </div>
                <div className="font-black text-lg">&quot;{topic}&quot;</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedParties.map((p) => (
                  <div
                    key={p.id}
                    className="px-2 py-1 rounded-full text-xs font-black border-2 border-white"
                    style={{ backgroundColor: p.color, color: p.textColor }}
                  >
                    {p.abbreviation}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Transcript Window */}
            <div
              className="cartoon-card p-4 md:p-6 min-h-80 max-h-[65vh] overflow-y-auto flex flex-col gap-4 border-3"
              style={{ backgroundColor: "#fbf9f4" }}
              id="debate-transcript"
            >
              {history.length === 0 && !isLoading && (
                <div className="text-center text-gray-400 py-12 flex flex-col items-center justify-center">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="font-extrabold text-gray-600">Debatten är redo att börja!</p>
                  <p className="text-xs text-gray-400 font-semibold mt-1">
                    Ställ en fråga som debattledare nedan, eller välj vilken partiledare som ska öppna debatten 👇
                  </p>
                </div>
              )}
              {history.map((entry, i) => {
                const party = PARTIES.find((p) => p.id === entry.speakerId);
                const isUser = entry.speakerId === "user";
                return (
                  <DebateBubble
                    key={i}
                    party={party}
                    isUser={isUser}
                    speakerName={entry.speakerName}
                    text={entry.text}
                    sources={entry.sources}
                    isStreaming={false}
                    turnNumber={i + 1}
                  />
                );
              })}

              {/* Streaming reply */}
              {isLoading && currentSpeakerParty && (
                <DebateBubble
                  party={currentSpeakerParty}
                  text={pendingText}
                  isStreaming={true}
                  turnNumber={history.length + 1}
                />
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Compact Chat Input Bar */}
            {!debateFinished && (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="cartoon-input flex-1 text-sm bg-white"
                  placeholder="🎙️ Ställ en fråga i debatten (tryck Enter eller klicka på ett parti nedan)..."
                  value={userInterjection}
                  onChange={(e) => setUserInterjection(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleUserInterjection();
                    }
                  }}
                  disabled={isLoading}
                  id="user-interjection-input"
                />
                <button
                  onClick={handleUserInterjection}
                  disabled={!userInterjection.trim() || isLoading}
                  className="cartoon-btn cartoon-btn-primary whitespace-nowrap text-sm px-4"
                  id="user-interjection-submit"
                >
                  💬 Skicka
                </button>
              </div>
            )}

            {/* Speaker selector */}
            {!debateFinished && (
              <DebateSpeakerSelector
                parties={selectedParties}
                onSelectSpeaker={handleSelectSpeaker}
                disabled={isLoading}
                currentSpeakerId={currentSpeakerId ?? undefined}
              />
            )}

            {/* Control buttons */}
            <div className="flex gap-3">
              {!debateFinished ? (
                <button
                  className="cartoon-btn cartoon-btn-danger flex-1"
                  onClick={endDebate}
                  disabled={isLoading}
                  id="end-debate-btn"
                >
                  🔴 Avsluta debatten
                </button>
              ) : (
                <div className="flex-1 space-y-3">
                  <div
                    className="p-3 rounded-xl border-2 text-sm font-bold text-center"
                    style={{
                      backgroundColor: "#f0fff4",
                      borderColor: "#22c55e",
                      color: "#15803d",
                    }}
                  >
                    ✅ Debatten är avslutad! {history.length} repliker totalt.
                  </div>
                  <button
                    className="cartoon-btn cartoon-btn-ghost w-full"
                    onClick={resetDebate}
                    id="new-debate-btn"
                  >
                    🔄 Ny debatt
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
