"use client";

import PartyChip from "@/components/shared/party-chip";
import QuestionInput from "@/components/shared/question-input";
import { PARTIES } from "@/lib/parties";
import type { PartyPersona } from "@/types/party";

interface InitialQuestionFormProps {
  selectedParty: PartyPersona | null;
  onSelectParty: (party: PartyPersona | null) => void;
  question: string;
  onQuestionChange: (question: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
}

export default function InitialQuestionForm({
  selectedParty,
  onSelectParty,
  question,
  onQuestionChange,
  onSubmit,
  onStop,
  isLoading,
}: InitialQuestionFormProps): React.JSX.Element {
  return (
    <section className="cartoon-card space-y-5 p-6">
      <QuestionInput
        buttonLabel={
          selectedParty
            ? `Fråga ${selectedParty.displayName.split(" ")[0]} från ${selectedParty.partyName}!`
            : "Fråga partiet!"
        }
        id="direct-question-input"
        isLoading={isLoading}
        onChange={onQuestionChange}
        onStop={onStop}
        onSubmit={onSubmit}
        placeholder={
          selectedParty ? `Fråga ${selectedParty.displayName}...` : "Skriv din fråga, välj sedan parti nedan..."
        }
        submitDisabled={!selectedParty}
        value={question}
      />

      <div className="border-gray-200 border-t-2 pt-5">
        <h2 className="mb-4 font-black text-lg">Välj parti att samtala med</h2>

        <div className="party-grid">
          {PARTIES.map((party) => (
            <PartyChip
              key={party.id}
              onClick={() => onSelectParty(selectedParty?.id === party.id ? null : party)}
              party={party}
              selected={selectedParty?.id === party.id}
              size="md"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
