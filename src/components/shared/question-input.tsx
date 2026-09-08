"use client";

import { Dices, Square } from "lucide-react";
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
  /** id of the visible heading that labels the textarea. */
  labelId: string;
  /** Tints the textarea's focus ring to match the current page's mode color. */
  accentColor?: string;
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
  labelId,
  accentColor,
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
        accentColor={accentColor}
        disabled={disabled || isLoading}
        id={id}
        labelledBy={labelId}
        maxLength={maxLength}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={value}
      />

      <div className="flex gap-3">
        <button
          className="cartoon-btn cartoon-btn-ghost text-xs"
          disabled={disabled || isLoading}
          id={`${id}-random`}
          onClick={() => onChange(getRandomExampleQuestion())}
          type="button"
        >
          <Dices aria-hidden="true" className="h-3.5 w-3.5" />
          Slumpa fråga
        </button>

        {isLoading && onStop ? (
          <button
            aria-label="Avbryt"
            className="cartoon-btn cartoon-btn-danger flex-1"
            id={`${id}-stop`}
            onClick={onStop}
            type="button"
          >
            <Square aria-hidden="true" className="h-4 w-4" fill="currentColor" />
            Avbryt
          </button>
        ) : (
          <button
            aria-label={buttonLabel}
            className="cartoon-btn cartoon-btn-primary flex-1"
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
    </InputStack>
  );
}
