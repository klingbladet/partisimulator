"use client";

import { Loader2, RotateCcw } from "lucide-react";

interface RegenerateButtonProps {
  onClick: () => void;
  isRegenerating?: boolean;
}

/** Shown on a failed reply, to re-run its generation in place. */
export default function RegenerateButton({
  onClick,
  isRegenerating = false,
}: RegenerateButtonProps): React.JSX.Element {
  return (
    <button
      aria-label="Försök igen"
      className="cartoon-btn cartoon-btn-ghost text-xs"
      disabled={isRegenerating}
      onClick={onClick}
      title="Försök igen"
      type="button"
    >
      {isRegenerating ? (
        <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      Försök igen
    </button>
  );
}
