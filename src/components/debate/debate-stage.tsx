"use client";

import { Lightbulb } from "lucide-react";
import PartyAvatar from "@/components/shared/party-avatar";
import type { PartyPersona } from "@/types/party";

interface DebateStageProps {
  parties: PartyPersona[];
  currentSpeakerId: string | null;
  isLoading: boolean;
  topic: string;
  onSelectSpeaker: (partyId: string) => void;
}

/** Slim header strip: topic on the left, every debater's avatar on the right — the current speaker gets a colored ring. */
export default function DebateStage({
  parties,
  currentSpeakerId,
  isLoading,
  topic,
  onSelectSpeaker,
}: DebateStageProps): React.JSX.Element {
  return (
    <section className="cartoon-card flex flex-wrap items-center gap-3 p-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Lightbulb aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-amber-500" />
        <span className="truncate font-black text-gray-800">&quot;{topic}&quot;</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {parties.map((party) => {
          const isSelected = currentSpeakerId === party.id;
          return (
            <button
              aria-pressed={isSelected}
              disabled={isLoading}
              id={`debate-speaker-${party.id}`}
              key={party.id}
              onClick={() => onSelectSpeaker(party.id)}
              style={{
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading && !isSelected ? 0.5 : 1,
              }}
              title={`${party.displayName} (${party.partyName})`}
              type="button"
            >
              <PartyAvatar
                badgeClassName="absolute -bottom-1 -end-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5"
                className="relative overflow-hidden rounded-full border-2"
                party={party}
                size={36}
                style={{
                  borderColor: isSelected ? party.color : "var(--border)",
                  boxShadow: isSelected ? `0 0 0 2px ${party.color}` : "none",
                }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
