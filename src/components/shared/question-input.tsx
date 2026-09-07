"use client";

import { Shuffle, Square } from "lucide-react";
import TypingDots from "@/components/shared/typing-dots";
import { getRandomExampleQuestion } from "@/lib/example-questions";

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Disables just the submit button (e.g. no party picked yet) without disabling the textarea itself. */
  submitDisabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  buttonLabel?: string;
  id?: string;
}

export default function QuestionInput({
  value,
  onChange,
  onSubmit,
  onStop,
  placeholder = "Skriv din fråga här...",
  disabled = false,
  submitDisabled = false,
  isLoading = false,
  maxLength = 500,
  buttonLabel = "Fråga!",
  id = "question-input",
}: QuestionInputProps): React.JSX.Element {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey && !disabled && !submitDisabled && !isLoading && value.trim()) {
      event.preventDefault();
      onSubmit();
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          aria-label="Skriv din fråga"
          className="cartoon-input pb-7"
          disabled={disabled || isLoading}
          id={id}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          value={value}
        />
        <div
          className="absolute end-4 bottom-3 rounded bg-white px-1.5 py-0.5 font-semibold text-xs"
          style={{ color: isNearLimit ? "var(--color-warning)" : "var(--color-placeholder)" }}
        >
          {charCount}/{maxLength}
        </div>
      </div>

      <button
        className="cartoon-btn cartoon-btn-ghost w-full text-xs"
        disabled={disabled || isLoading}
        id={`${id}-random`}
        onClick={() => onChange(getRandomExampleQuestion())}
        type="button"
      >
        <Shuffle className="h-3.5 w-3.5" />
        Slumpa fråga
      </button>

      {isLoading && onStop ? (
        <button
          aria-label="Avbryt"
          className="cartoon-btn cartoon-btn-danger w-full"
          id={`${id}-stop`}
          onClick={onStop}
          type="button"
        >
          <Square className="h-4 w-4" fill="currentColor" />
          Avbryt
        </button>
      ) : (
        <button
          aria-label={buttonLabel}
          className="cartoon-btn cartoon-btn-primary w-full"
          disabled={disabled || submitDisabled || isLoading || !value.trim()}
          id={`${id}-submit`}
          onClick={onSubmit}
          type="button"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <TypingDots dotColor="white" />
              Tänker...
            </span>
          ) : (
            buttonLabel
          )}
        </button>
      )}
    </div>
  );
}
