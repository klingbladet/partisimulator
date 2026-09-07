import { Check, Minus, X } from "lucide-react";
import type { ComponentType } from "react";
import type { Stance } from "@/lib/sources";

interface StanceMeterProps {
  stance: Stance | undefined;
}

const STANCE_CONFIG: Record<
  Stance,
  { label: string; Icon: ComponentType<{ className?: string }>; background: string }
> = {
  emot: { background: "var(--color-error-border)", Icon: X, label: "Håller inte med" },
  for: { background: "var(--color-success)", Icon: Check, label: "Håller med" },
  neutralt: { background: "var(--color-white)", Icon: Minus, label: "Neutral" },
};

/** Small Agree/Disagree/Neutral badge, based on the model's self-reported [STÅNDPUNKT: ...] marker. */
export default function StanceMeter({ stance }: StanceMeterProps): React.JSX.Element | null {
  if (!stance) return null;
  const { label, Icon, background } = STANCE_CONFIG[stance];
  const textColorClassName = stance === "neutralt" ? "text-[var(--color-ink)]" : "text-white";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-black px-2.5 py-0.5 font-black text-[11px] uppercase tracking-wide shadow-[2px_2px_0_var(--border)] ${textColorClassName}`}
      style={{ backgroundColor: background }}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      <span>{label}</span>
    </span>
  );
}
