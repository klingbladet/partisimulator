"use client";

import { Lightbulb, Mic, Shuffle, Users } from "lucide-react";
import PartyChip from "@/components/shared/party-chip";
import { getRandomExampleQuestion } from "@/lib/example-questions";
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
      {/* Topic input */}
      <section className="cartoon-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-black text-lg">
          <Lightbulb className="h-5 w-5" />
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
          placeholder={`T.ex. "Hur ska Sverige bekämpa brottsligheten?"`}
          type="text"
          value={topic}
        />
        <button
          className="cartoon-btn cartoon-btn-ghost mt-3 text-xs"
          id="debate-topic-random"
          onClick={() => onTopicChange(getRandomExampleQuestion())}
          style={{ inlineSize: "100%" }}
          type="button"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Slumpa fråga
        </button>

        {/* Start button — directly under the input, like the submit button in QuestionInput */}
        <button
          className="cartoon-btn cartoon-btn-primary mt-3 py-4 text-lg"
          disabled={selectedParties.length < 2 || !topic.trim()}
          id="start-debate-btn"
          onClick={onStartDebate}
          style={{ inlineSize: "100%" }}
          type="button"
        >
          {selectedParties.length < 2 ? (
            "Välj minst 2 partier nedan..."
          ) : (
            <>
              <Mic className="h-5 w-5" />
              {`Starta debatten om "${topic || "..."}"`}
            </>
          )}
        </button>
      </section>

      {/* Party selector */}
      <section className="cartoon-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-black text-lg">
          <Users className="h-5 w-5" />
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
    </div>
  );
}
