"use client";

import PartyChip from "@/components/party-chip";
import { PARTIES } from "@/lib/parties";
import type { PartyPersona } from "@/types/party";

interface DebateSetupPanelProps {
  selectedParties: PartyPersona[];
  onToggleParty: (party: PartyPersona) => void;
  topic: string;
  onTopicChange: (topic: string) => void;
  onStartDebate: () => void;
}

export default function DebateSetupPanel({
  selectedParties,
  onToggleParty,
  topic,
  onTopicChange,
  onStartDebate,
}: DebateSetupPanelProps): React.JSX.Element {
  const isSelected = (party: PartyPersona): boolean =>
    !!selectedParties.find((selectedParty) => selectedParty.id === party.id);

  return (
    <div className="space-y-6">
      {/* Party selector */}
      <section className="cartoon-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-black text-lg">
          <span>🎭</span>
          <span>Välj debattörer (minst 2)</span>
        </h2>
        <div className="party-grid">
          {PARTIES.map((party) => (
            <PartyChip
              key={party.id}
              onClick={() => onToggleParty(party)}
              party={party}
              selected={isSelected(party)}
              size="md"
            />
          ))}
        </div>
        {selectedParties.length > 0 && (
          <div className="mt-3 font-bold text-gray-600 text-sm">
            Valda: {selectedParties.map((selectedParty) => selectedParty.displayName).join(", ")}
          </div>
        )}
      </section>

      {/* Topic input */}
      <section className="cartoon-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-black text-lg">
          <span>💡</span>
          <span>Debattämne</span>
        </h2>
        <input
          className="cartoon-input"
          id="debate-topic-input"
          onChange={(event) => onTopicChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onStartDebate();
            }
          }}
          placeholder="T.ex. 'Hur ska Sverige bekämpa brottsligheten?'"
          type="text"
          value={topic}
        />
      </section>

      {/* Start button */}
      <button
        className="cartoon-btn cartoon-btn-primary w-full py-4 text-lg"
        disabled={selectedParties.length < 2 || !topic.trim()}
        id="start-debate-btn"
        onClick={onStartDebate}
        type="button"
      >
        {selectedParties.length < 2 ? "Välj minst 2 partier..." : `🎤 Starta debatten om "${topic || "..."}"`}
      </button>
    </div>
  );
}
