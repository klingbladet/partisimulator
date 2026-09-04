"use client";

import { CheckCircle2, Flag, MessageCircle, Pause, Play, RotateCcw, Send, Square } from "lucide-react";
import AppNav from "@/components/app-nav";
import { DebateBubble } from "@/components/debate-components";
import DebateSetupPanel from "@/components/debate-setup-panel";
import DebateStage from "@/components/debate-stage";
import PageContainer from "@/components/page-container";
import SiteFooter from "@/components/site-footer";
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
    autoMode,
    toggleAutoMode,
    toggleParty,
    startDebate,
    handleUserInterjection,
    handleSelectSpeaker,
    handleStop,
    endDebate,
    resetDebate,
  } = useDebate();

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <PageContainer className="px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-black text-3xl text-black leading-tight">Debatt</h1>
          <p className="mt-1 font-semibold text-gray-600">
            Välj partier och låt dem debattera – styr talarordningen själv eller kör automatiskt.
          </p>
        </div>

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
          <div className="w-full space-y-3">
            {/* Compact Chat Input Bar */}
            {!debateFinished && (
              <div className="flex flex-col gap-2">
                <input
                  className="cartoon-input text-sm"
                  disabled={isLoading}
                  id="user-interjection-input"
                  onChange={(event) => setUserInterjection(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleUserInterjection();
                    }
                  }}
                  placeholder="Ställ en fråga i debatten (tryck Enter eller klicka på ett parti nedan)..."
                  type="text"
                  value={userInterjection}
                />
                {isLoading ? (
                  <button
                    className="cartoon-btn cartoon-btn-danger text-sm"
                    id="debate-stop-btn"
                    onClick={handleStop}
                    style={{ inlineSize: "100%" }}
                    type="button"
                  >
                    <Square className="h-4 w-4" />
                    Avbryt
                  </button>
                ) : (
                  <button
                    className="cartoon-btn cartoon-btn-primary text-sm"
                    disabled={!userInterjection.trim()}
                    id="user-interjection-submit"
                    onClick={handleUserInterjection}
                    style={{ inlineSize: "100%" }}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    Skicka
                  </button>
                )}
              </div>
            )}

            {/* Control buttons */}
            <div className="flex gap-3">
              {!debateFinished ? (
                <>
                  <button
                    className="cartoon-btn cartoon-btn-primary flex-1 shadow-sm"
                    id="auto-mode-toggle-btn"
                    onClick={toggleAutoMode}
                    type="button"
                  >
                    {autoMode ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pausa debatt
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Fortsätt debatt
                      </>
                    )}
                  </button>
                  <button
                    className="cartoon-btn cartoon-btn-danger flex-1 shadow-sm"
                    disabled={isLoading}
                    id="end-debate-btn"
                    onClick={endDebate}
                    type="button"
                  >
                    <Flag className="h-4 w-4" />
                    Avsluta debatten
                  </button>
                </>
              ) : (
                <div className="flex-1 space-y-3">
                  <div className="status-banner-success font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Debatten är avslutad! {history.length} repliker totalt.
                  </div>
                  <button
                    className="cartoon-btn cartoon-btn-ghost w-full bg-white"
                    id="new-debate-btn"
                    onClick={resetDebate}
                    type="button"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Ny debatt
                  </button>
                </div>
              )}
            </div>

            {/* Party cards — pick who speaks next */}
            <DebateStage
              currentSpeakerId={currentSpeakerId}
              isLoading={isLoading}
              onSelectSpeaker={handleSelectSpeaker}
              parties={selectedParties}
              topic={topic}
            />

            {/* Roomy, Higher & Narrower Chat Transcript Window */}
            <div
              className="cartoon-card flex h-[340px] flex-col gap-3.5 overflow-y-auto border-3 p-3.5 sm:h-[400px] sm:p-5 md:h-[440px]"
              id="debate-transcript"
              ref={transcriptContainerRef}
              style={{ backgroundColor: "#fbf9f4" }}
            >
              {history.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                  <MessageCircle className="mb-1.5 h-8 w-8" />
                  <p className="font-extrabold text-gray-700 text-sm">Debatten är redo att börja!</p>
                  <p className="mt-1 font-semibold text-gray-400 text-xs">
                    Ställ en fråga som debattledare ovan, eller klicka på den partiledare som ska tala.
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
          </div>
        )}
      </PageContainer>

      <SiteFooter />
    </div>
  );
}
