"use client";

import PartyChip from "@/components/party-chip";
import QuestionInput from "@/components/question-input";
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
        buttonLabel={`Fråga ${selectedParty?.abbreviation ?? "partiet"}!`}
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

        {selectedParty && (
          <div
            className="mt-4 animate-in rounded-xl border-2 p-3 font-semibold text-sm"
            style={{
              backgroundColor: `${selectedParty.color}15`,
              borderColor: selectedParty.color,
              color: "var(--color-ink)",
            }}
          >
            <strong style={{ color: selectedParty.color }}>{selectedParty.displayName}</strong> (
            {selectedParty.partyName}) är vald.{" "}
            <span className="text-gray-500">Hjärtefrågor: {selectedParty.keyIssues.join(", ")}</span>
          </div>
        )}
      </div>
    </section>
  );
}
