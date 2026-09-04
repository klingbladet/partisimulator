"use client";

import Image from "next/image";
import AppNav from "@/components/app-nav";
import { DebateBubble, DebateSpeakerSelector } from "@/components/debate-components";
import DebateSetupPanel from "@/components/debate-setup-panel";
import DebateStage from "@/components/debate-stage";
import { useDebate } from "@/hooks/use-debate";
import { PARTIES } from "@/lib/parties";

export default function DebattPage(): React.JSX.Element {
  const {
    selectedParties,
    topic,
    setTopic,
    debateStarted,
    debateFinished,
    history,
    currentSpeakerId,
    currentSpeakerParty,
    pendingText,
    userInterjection,
    setUserInterjection,
    transcriptContainerRef,
    isLoading,
    toggleParty,
    startDebate,
    handleUserInterjection,
    handleSelectSpeaker,
    endDebate,
    resetDebate,
  } = useDebate();

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: "#1e293b" }}>
      {/* Full-Page Riksdag Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Image
          alt="Sveriges Riksdag debattsal"
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/assets/plenisalen.webp"
        />
        {/* Subtle dark backdrop so cards and text remain crystal clear */}
        <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1.5px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <AppNav />

        <main className="mx-auto w-full max-w-5xl flex-1 px-2 py-3 sm:px-4 sm:py-5">
          {/* Header (shown during setup) */}
          {!debateStarted && (
            <div className="mx-auto mb-6 max-w-xl rounded-2xl border-2 border-black bg-white/90 p-4 text-center shadow-[3px_3px_0px_#1a1a1a] backdrop-blur-sm">
              <h1 className="mb-1 flex items-center justify-center gap-3 font-black text-2xl text-black sm:text-3xl">
                <span>🎤</span>
                Debattläge
              </h1>
              <p className="font-semibold text-gray-600 text-xs sm:text-sm">
                Välj partier, sätt ämne, styr talarordningen själv
              </p>
            </div>
          )}

          {!debateStarted ? (
            <DebateSetupPanel
              onStartDebate={startDebate}
              onToggleParty={toggleParty}
              onTopicChange={setTopic}
              selectedParties={selectedParties}
              topic={topic}
            />
          ) : (
            /* Debate view */
            <div className="mx-auto w-full max-w-3xl space-y-3">
              {/* Live Debate Stage with Standing Politicians */}
              <DebateStage
                currentSpeakerId={currentSpeakerId}
                isLoading={isLoading}
                onSelectSpeaker={handleSelectSpeaker}
                parties={selectedParties}
                topic={topic}
              />

              {/* Roomy, Higher & Narrower Chat Transcript Window */}
              <div
                className="cartoon-card flex h-[340px] flex-col gap-3.5 overflow-y-auto border-2 bg-white/95 p-3.5 shadow-[4px_4px_0px_#1a1a1a] backdrop-blur-sm sm:h-[400px] sm:p-5 md:h-[440px]"
                id="debate-transcript"
                ref={transcriptContainerRef}
              >
                {history.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                    <div className="mb-1.5 text-3xl">💬</div>
                    <p className="font-extrabold text-gray-700 text-sm">Debatten är redo att börja!</p>
                    <p className="mt-1 font-semibold text-gray-400 text-xs">
                      Ställ en fråga som debattledare nedan, eller klicka på den partiledare som ska tala 👇
                    </p>
                  </div>
                )}
                {history.map((entry, index) => {
                  const party = PARTIES.find((candidateParty) => candidateParty.id === entry.speakerId);
                  const isUser = entry.speakerId === "user";
                  return (
                    <DebateBubble
                      isStreaming={false}
                      isUser={isUser}
                      key={entry.id}
                      party={party}
                      sources={entry.sources}
                      speakerName={entry.speakerName}
                      text={entry.text}
                      turnNumber={index + 1}
                    />
                  );
                })}

                {/* Streaming reply */}
                {isLoading && currentSpeakerParty && (
                  <DebateBubble
                    isStreaming={true}
                    party={currentSpeakerParty}
                    text={pendingText}
                    turnNumber={history.length + 1}
                  />
                )}
              </div>

              {/* Compact Chat Input Bar */}
              {!debateFinished && (
                <div className="flex gap-2">
                  <input
                    className="cartoon-input flex-1 border-2 bg-white/95 text-sm shadow-sm"
                    disabled={isLoading}
                    id="user-interjection-input"
                    onChange={(event) => setUserInterjection(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleUserInterjection();
                      }
                    }}
                    placeholder="🎙️ Ställ en fråga i debatten (tryck Enter eller klicka på ett parti nedan)..."
                    type="text"
                    value={userInterjection}
                  />
                  <button
                    className="cartoon-btn cartoon-btn-primary whitespace-nowrap px-4 text-sm"
                    disabled={!userInterjection.trim() || isLoading}
                    id="user-interjection-submit"
                    onClick={handleUserInterjection}
                    type="button"
                  >
                    💬 Skicka
                  </button>
                </div>
              )}

              {/* Speaker selector */}
              {!debateFinished && (
                <div className="rounded-2xl border-2 border-black bg-white/85 p-3 shadow-sm backdrop-blur-sm">
                  <DebateSpeakerSelector
                    currentSpeakerId={currentSpeakerId ?? undefined}
                    disabled={isLoading}
                    onSelectSpeaker={handleSelectSpeaker}
                    parties={selectedParties}
                  />
                </div>
              )}

              {/* Control buttons */}
              <div className="flex gap-3 pt-1">
                {!debateFinished ? (
                  <button
                    className="cartoon-btn cartoon-btn-danger flex-1 shadow-sm"
                    disabled={isLoading}
                    id="end-debate-btn"
                    onClick={endDebate}
                    type="button"
                  >
                    🔴 Avsluta debatten
                  </button>
                ) : (
                  <div className="flex-1 space-y-3">
                    <div
                      className="rounded-xl border-2 p-3 text-center font-bold text-sm"
                      style={{
                        backgroundColor: "#f0fff4",
                        borderColor: "#22c55e",
                        color: "#15803d",
                      }}
                    >
                      ✅ Debatten är avslutad! {history.length} repliker totalt.
                    </div>
                    <button
                      className="cartoon-btn cartoon-btn-ghost w-full bg-white"
                      id="new-debate-btn"
                      onClick={resetDebate}
                      type="button"
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
    </div>
  );
}
