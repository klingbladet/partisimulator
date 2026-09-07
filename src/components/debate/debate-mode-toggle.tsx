"use client";

import { Pause, Play } from "lucide-react";

interface DebateModeToggleProps {
  autoMode: boolean;
  disabled?: boolean;
  onToggleAutoMode: () => void;
}

export default function DebateModeToggle({
  autoMode,
  disabled = false,
  onToggleAutoMode,
}: DebateModeToggleProps): React.JSX.Element {
  return (
    <button
      aria-label={autoMode ? "Stäng av auto-läge" : "Slå på auto-läge"}
      className={`cartoon-btn w-full ${autoMode ? "text-[var(--color-ink)]" : "text-white"}`}
      disabled={disabled}
      id="auto-mode-toggle-btn"
      onClick={onToggleAutoMode}
      style={{ backgroundColor: autoMode ? "var(--color-warning)" : "var(--color-success)" }}
      title={autoMode ? "Stäng av auto-läge" : "Slå på auto-läge"}
      type="button"
    >
      {autoMode ? (
        <>
          <Pause aria-hidden="true" className="h-4 w-4" />
          Stäng av auto-läge
        </>
      ) : (
        <>
          <Play aria-hidden="true" className="h-4 w-4" />
          Slå på auto-läge
        </>
      )}
    </button>
  );
}
