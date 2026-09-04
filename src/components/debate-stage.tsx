"use client";

import { Lightbulb } from "lucide-react";
import PartyChip from "@/components/party-chip";
import type { PartyPersona } from "@/types/party";

interface DebateStageProps {
  parties: PartyPersona[];
  currentSpeakerId: string | null;
  isLoading: boolean;
  topic: string;
  onSelectSpeaker: (partyId: string) => void;
}

export default function DebateStage({
  parties,
  currentSpeakerId,
  isLoading,
  topic,
  onSelectSpeaker,
}: DebateStageProps): React.JSX.Element {
  return (
    <section className="cartoon-card p-4">
      <h2 className="mb-4 flex items-center gap-2 font-black text-2xl text-gray-800 sm:text-3xl">
        <Lightbulb className="h-6 w-6 flex-shrink-0 text-amber-500 sm:h-7 sm:w-7" />
        <span className="truncate">&quot;{topic}&quot;</span>
      </h2>
      <div className="flex flex-wrap gap-3">
        {parties.map((party) => (
          <PartyChip
            disabled={isLoading}
            fullWidth
            key={party.id}
            onClick={() => onSelectSpeaker(party.id)}
            party={party}
            selected={currentSpeakerId === party.id}
            size="md"
          />
        ))}
      </div>
    </section>
  );
}
