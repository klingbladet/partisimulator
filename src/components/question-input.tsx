"use client";

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  buttonLabel?: string;
  id?: string;
}

export default function QuestionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Skriv din fråga här...",
  disabled = false,
  isLoading = false,
  maxLength = 500,
  buttonLabel = "Fråga! 🎤",
  id = "question-input",
}: QuestionInputProps): React.JSX.Element {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey && !disabled && !isLoading && value.trim()) {
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
          className="cartoon-input"
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
          className="absolute right-3 bottom-2 font-semibold text-xs"
          style={{ color: isNearLimit ? "#f0a500" : "#aaa" }}
        >
          {charCount}/{maxLength}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-gray-400 text-xs">⌨️ Enter för att skicka · Shift+Enter för ny rad</p>
        <button
          aria-label={buttonLabel}
          className="cartoon-btn cartoon-btn-primary flex-shrink-0"
          disabled={disabled || isLoading || !value.trim()}
          id={`${id}-submit`}
          onClick={onSubmit}
          type="button"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="typing-dots">
                <span style={{ background: "white" }} />
                <span style={{ background: "white" }} />
                <span style={{ background: "white" }} />
              </span>
              Tänker...
            </span>
          ) : (
            buttonLabel
          )}
        </button>
      </div>
    </div>
  );
}
