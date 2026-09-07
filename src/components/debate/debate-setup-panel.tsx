"use client";

import { MessageSquare, Mic, Shuffle } from "lucide-react";
import CountedTextarea from "@/components/shared/counted-textarea";
import InputStack from "@/components/shared/input-stack";
import PartyPickerCard from "@/components/shared/party-picker-card";
import { getRandomExampleQuestion } from "@/lib/example-questions";
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
        <h2 className="mb-4 flex items-center gap-2 font-black text-lg" id="debate-topic-heading">
          <MessageSquare aria-hidden="true" className="h-5 w-5" />
          <span>Ämne</span>
        </h2>

        <InputStack>
          <CountedTextarea
            id="debate-topic-input"
            labelledBy="debate-topic-heading"
            maxLength={500}
            onChange={onTopicChange}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onStartDebate();
              }
            }}
            placeholder={`T.ex. "Hur ska Sverige bekämpa brottsligheten?"`}
            value={topic}
          />
          <button
            className="cartoon-btn cartoon-btn-ghost w-full text-xs"
            id="debate-topic-random"
            onClick={() => onTopicChange(getRandomExampleQuestion())}
            type="button"
          >
            <Shuffle aria-hidden="true" className="h-3.5 w-3.5" />
            Slumpa fråga
          </button>

          {/* Start button — directly under the input, like the submit button in QuestionInput */}
          <button
            className="cartoon-btn cartoon-btn-primary w-full py-4 text-lg"
            disabled={selectedParties.length < 2 || !topic.trim()}
            id="start-debate-btn"
            onClick={onStartDebate}
            type="button"
          >
            {selectedParties.length < 2 ? (
              "Välj minst 2 partier nedan..."
            ) : (
              <>
                <Mic aria-hidden="true" className="h-5 w-5" />
                {`Starta debatten om "${topic || "..."}"`}
              </>
            )}
          </button>
        </InputStack>
      </section>

      {/* Party selector */}
      <PartyPickerCard heading="Välj debattörer (minst 2)" isSelected={isSelected} onSelectParty={onToggleParty}>
        {selectedParties.length > 0 && (
          <div className="mt-3 font-bold text-gray-600 text-sm">
            Valda: {selectedParties.map((selectedParty) => selectedParty.displayName).join(", ")}
          </div>
        )}
      </PartyPickerCard>
    </div>
  );
}
