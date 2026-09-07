import { Check, Minus, X } from "lucide-react";
import type { ComponentType } from "react";
import type { Stance } from "@/lib/sources";

interface StanceMeterProps {
  stance: Stance | undefined;
}

const STANCE_CONFIG: Record<Stance, { label: string; Icon: ComponentType<{ className?: string }>; className: string }> =
  {
    emot: { className: "border-red-400 bg-red-50 text-red-700", Icon: X, label: "Håller inte med" },
    for: { className: "border-green-400 bg-green-50 text-green-700", Icon: Check, label: "Håller med" },
    neutralt: { className: "border-gray-400 bg-gray-50 text-gray-700", Icon: Minus, label: "Neutral" },
  };

/** Small Agree/Disagree/Neutral pill, based on the model's self-reported [STÅNDPUNKT: ...] marker. */
export default function StanceMeter({ stance }: StanceMeterProps): React.JSX.Element | null {
  if (!stance) return null;
  const { label, Icon, className } = STANCE_CONFIG[stance];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 font-bold text-[11px] uppercase tracking-wide ${className}`}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </span>
  );
}
