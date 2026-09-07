"use client";

import PartyPickerCard from "@/components/shared/party-picker-card";
import QuestionInputCard from "@/components/shared/question-input-card";
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
    <div className="space-y-6">
      <QuestionInputCard
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

      <PartyPickerCard
        heading="Vem vill du fråga?"
        isSelected={(party) => selectedParty?.id === party.id}
        onSelectParty={(party) => onSelectParty(selectedParty?.id === party.id ? null : party)}
      />
    </div>
  );
}
