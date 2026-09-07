"use client";

import { Shuffle, Square } from "lucide-react";
import CountedTextarea from "@/components/shared/counted-textarea";
import InputStack from "@/components/shared/input-stack";
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

  return (
    <InputStack>
      <CountedTextarea
        ariaLabel="Skriv din fråga"
        disabled={disabled || isLoading}
        id={id}
        maxLength={maxLength}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={value}
      />

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
    </InputStack>
  );
}
