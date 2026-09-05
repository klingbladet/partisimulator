interface TypingDotsProps {
  /** Sets the dots' color via currentColor; omit to inherit from the surrounding text. */
  color?: string;
  /** Overrides each dot's own background, for cases where currentColor isn't the desired dot fill (e.g. white dots on a colored button). */
  dotColor?: string;
  /** When set, also marks the indicator as a status region for screen readers. */
  ariaLabel?: string;
  className?: string;
}

/** Bouncing three-dot "generating a reply" indicator, shared by the bubbles, the answer card header, and the question input's submit button. */
export default function TypingDots({
  color,
  dotColor,
  ariaLabel,
  className = "typing-dots",
}: TypingDotsProps): React.JSX.Element {
  const dotStyle = dotColor ? { background: dotColor } : undefined;
  const dots = (
    <>
      <span style={dotStyle} />
      <span style={dotStyle} />
      <span style={dotStyle} />
    </>
  );

  if (ariaLabel) {
    return (
      <span aria-label={ariaLabel} className={className} role="status" style={color ? { color } : undefined}>
        {dots}
      </span>
    );
  }

  return (
    <span className={className} style={color ? { color } : undefined}>
      {dots}
    </span>
  );
}
