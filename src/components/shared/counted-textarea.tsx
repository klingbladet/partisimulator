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
  /** id of the visible heading that labels this field, so the accessible name matches on-screen text. */
  labelledBy: string;
  /** Tints the focus ring to match the current page's mode color; falls back to the default dark ring when unset. */
  accentColor?: string;
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
  labelledBy,
  accentColor,
}: CountedTextareaProps): React.JSX.Element {
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;

  return (
    <div className="relative" style={{ "--input-accent": accentColor } as React.CSSProperties}>
      <textarea
        aria-labelledby={labelledBy}
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
        className={`absolute end-4 bottom-3 rounded bg-white px-1.5 py-0.5 font-semibold text-xs ${
          isNearLimit ? "text-amber-700" : "text-gray-600"
        }`}
      >
        {charCount}/{maxLength}
      </div>
    </div>
  );
}
