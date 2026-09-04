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
  onAskAll: () => void;
  isLoading: boolean;
}

export default function InitialQuestionForm({
  selectedParty,
  onSelectParty,
  question,
  onQuestionChange,
  onSubmit,
  onAskAll,
  isLoading,
}: InitialQuestionFormProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Party selection */}
      <section className="cartoon-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-black text-lg">
          <span>🎯</span>
          <span>Steg 1: Välj parti att samtala med</span>
        </h2>

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
      </section>

      {/* Question input */}
      <section className="cartoon-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-black text-lg">
          <span>💬</span>
          <span>Steg 2: Skriv din fråga</span>
        </h2>

        <QuestionInput
          buttonLabel={`Fråga ${selectedParty?.abbreviation ?? "partiet"}! 🎤`}
          disabled={!selectedParty}
          id="direct-question-input"
          isLoading={isLoading}
          onChange={onQuestionChange}
          onSubmit={onSubmit}
          placeholder={selectedParty ? `Fråga ${selectedParty.displayName}...` : "Välj ett parti ovan först..."}
          value={question}
        />

        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 border-gray-200 border-t-2 border-dashed" />
          <span className="font-bold text-gray-400 text-sm">eller</span>
          <div className="flex-1 border-gray-200 border-t-2 border-dashed" />
        </div>

        <button
          className="cartoon-btn cartoon-btn-ghost mt-3 w-full"
          disabled={!question.trim() || isLoading}
          id="ask-all-btn"
          onClick={onAskAll}
          type="button"
        >
          🔲 Fråga alla 8 partier på en gång!
        </button>
      </section>
    </div>
  );
}
