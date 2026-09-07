"use client";

import { MessageCircle } from "lucide-react";
import DebateControls from "@/components/debate/debate-controls";
import DebateSetupPanel from "@/components/debate/debate-setup-panel";
import DebateStage from "@/components/debate/debate-stage";
import AppNav from "@/components/shared/app-nav";
import Bubble from "@/components/shared/bubble";
import PageContainer from "@/components/shared/page-container";
import PageHeader from "@/components/shared/page-header";
import SiteFooter from "@/components/shared/site-footer";
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
    pendingText,
    streamingEntryId,
    userInterjection,
    setUserInterjection,
    transcriptContainerRef,
    isLoading,
    autoMode,
    toggleAutoMode,
    toggleParty,
    startDebate,
    handleUserInterjection,
    handleNextSpeaker,
    handleSelectSpeaker,
    handleStop,
    endDebate,
    resetDebate,
  } = useDebate();

  const handleEndDebate = (): void => {
    if (window.confirm("Vill du verkligen avsluta debatten?")) {
      endDebate();
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <PageContainer className="px-4 py-8">
        <PageHeader
          description="Välj partier och låt dem debattera – styr talarordningen själv eller kör automatiskt."
          title="Debatt"
        />

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
          <div className="w-full space-y-4">
            {/* Topic + who's debating, in one slim strip — the active speaker gets a colored ring */}
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
              style={{ backgroundColor: "var(--color-cream)" }}
            >
              {history.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                  <MessageCircle aria-hidden="true" className="mb-1.5 h-8 w-8" />
                  <p className="font-extrabold text-gray-700 text-sm">Debatten är redo att börja!</p>
                  <p className="mt-1 font-semibold text-gray-400 text-xs">
                    Ställ en fråga som debattledare nedan, eller klicka på den partiledare som ska tala ovan.
                  </p>
                </div>
              )}
              {history.map((entry, index) => {
                const isEntryStreaming = entry.id === streamingEntryId;
                const party = PARTIES.find((candidateParty) => candidateParty.id === entry.speakerId);
                const isUser = entry.speakerId === "user";
                return (
                  <Bubble
                    isStreaming={isEntryStreaming}
                    isUser={isUser}
                    key={entry.id}
                    manifestUrl={entry.manifestUrl}
                    party={party}
                    sources={entry.sources}
                    speakerName={entry.speakerName}
                    text={isEntryStreaming ? pendingText : entry.text}
                    turnNumber={index + 1}
                    variant="debate"
                  />
                );
              })}
            </div>

            <DebateControls
              autoMode={autoMode}
              debateFinished={debateFinished}
              isLoading={isLoading}
              onEndDebate={handleEndDebate}
              onNextSpeaker={handleNextSpeaker}
              onResetDebate={resetDebate}
              onStop={handleStop}
              onToggleAutoMode={toggleAutoMode}
              onUserInterjectionChange={setUserInterjection}
              onUserInterjectionSubmit={handleUserInterjection}
              userInterjection={userInterjection}
            />
          </div>
        )}
      </PageContainer>

      <SiteFooter />
    </div>
  );
}
