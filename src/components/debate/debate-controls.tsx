"use client";

import { Flag, Pause, Play, RotateCcw, Send, Square, XCircle } from "lucide-react";

interface DebateControlsProps {
  debateFinished: boolean;
  isLoading: boolean;
  userInterjection: string;
  onUserInterjectionChange: (value: string) => void;
  onUserInterjectionSubmit: () => void;
  autoMode: boolean;
  onToggleAutoMode: () => void;
  onNextSpeaker: () => void;
  onStop: () => void;
  onEndDebate: () => void;
  onResetDebate: () => void;
}

/** Compact bottom bar: interjection input plus icon buttons for send/stop, pause/resume, and end debate. */
export default function DebateControls({
  debateFinished,
  isLoading,
  userInterjection,
  onUserInterjectionChange,
  onUserInterjectionSubmit,
  autoMode,
  onToggleAutoMode,
  onNextSpeaker,
  onStop,
  onEndDebate,
  onResetDebate,
}: DebateControlsProps): React.JSX.Element {
  if (debateFinished) {
    return (
      <div className="cartoon-card flex flex-col items-center gap-3 p-6 text-center">
        <Flag className="h-8 w-8" />
        <p className="font-black text-black text-xl">Debatten är slut!</p>
        <p className="font-semibold text-gray-600 text-sm">Nu återstår bara att räkna rösterna.</p>
        <button className="cartoon-btn cartoon-btn-primary" id="new-debate-btn" onClick={onResetDebate} type="button">
          <RotateCcw className="h-4 w-4" />
          Ny debatt
        </button>
      </div>
    );
  }

  return (
    <div className="cartoon-card flex items-center gap-2 p-3">
      <input
        className="cartoon-input flex-1 text-sm"
        id="user-interjection-input"
        onChange={(event) => onUserInterjectionChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onUserInterjectionSubmit();
          }
        }}
        placeholder="Ställ en fråga i debatten..."
        type="text"
        value={userInterjection}
      />

      <button
        aria-label="Skicka"
        className="cartoon-btn cartoon-btn-primary"
        disabled={!userInterjection.trim()}
        id="user-interjection-submit"
        onClick={onUserInterjectionSubmit}
        title="Skicka"
        type="button"
      >
        <Send className="h-4 w-4" />
      </button>

      {isLoading && (
        <button
          aria-label="Avbryt"
          className="cartoon-btn cartoon-btn-danger"
          id="debate-stop-btn"
          onClick={onStop}
          title="Avbryt"
          type="button"
        >
          <Square className="h-4 w-4" />
        </button>
      )}

      <button
        aria-label={autoMode ? "Pausa debatten" : "Fortsätt debatten"}
        className="cartoon-btn cartoon-btn-ghost"
        id="auto-mode-toggle-btn"
        onClick={onToggleAutoMode}
        title={autoMode ? "Pausa debatten" : "Fortsätt debatten"}
        type="button"
      >
        {autoMode ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      {!autoMode && !isLoading && (
        <button
          aria-label="Nästa replik"
          className="cartoon-btn cartoon-btn-ghost"
          id="next-speaker-btn"
          onClick={onNextSpeaker}
          title="Nästa replik"
          type="button"
        >
          <Play className="h-4 w-4" />
        </button>
      )}

      <button
        aria-label="Avsluta debatten"
        className="cartoon-btn cartoon-btn-danger"
        disabled={isLoading}
        id="end-debate-btn"
        onClick={onEndDebate}
        title="Avsluta debatten"
        type="button"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}
