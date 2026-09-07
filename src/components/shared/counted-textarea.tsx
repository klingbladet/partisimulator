"use client";

interface CountedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength: number;
  rows?: number;
  id: string;
  ariaLabel: string;
}

export default function CountedTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled = false,
  maxLength,
  rows = 3,
  id,
  ariaLabel,
}: CountedTextareaProps): React.JSX.Element {
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;

  return (
    <div className="relative">
      <textarea
        aria-label={ariaLabel}
        className="cartoon-input pb-7"
        disabled={disabled}
        id={id}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      <div
        className="absolute end-4 bottom-3 rounded bg-white px-1.5 py-0.5 font-semibold text-xs"
        style={{ color: isNearLimit ? "var(--color-warning)" : "var(--color-placeholder)" }}
      >
        {charCount}/{maxLength}
      </div>
    </div>
  );
}
