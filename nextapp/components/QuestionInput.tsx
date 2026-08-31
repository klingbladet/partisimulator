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
}: QuestionInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled && !isLoading && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          id={id}
          className="cartoon-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          maxLength={maxLength}
          rows={3}
          aria-label="Skriv din fråga"
        />
        <div
          className="absolute bottom-2 right-3 text-xs font-semibold"
          style={{ color: isNearLimit ? "#f0a500" : "#aaa" }}
        >
          {charCount}/{maxLength}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400 font-semibold">
          ⌨️ Enter för att skicka · Shift+Enter för ny rad
        </p>
        <button
          className="cartoon-btn cartoon-btn-primary flex-shrink-0"
          onClick={onSubmit}
          disabled={disabled || isLoading || !value.trim()}
          id={`${id}-submit`}
          aria-label={buttonLabel}
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
