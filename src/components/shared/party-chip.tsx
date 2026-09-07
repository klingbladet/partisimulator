"use client";

import clsx from "clsx";
import PartyAvatar from "@/components/shared/party-avatar";
import type { PartyPersona } from "@/types/party";

interface PartyChipProps {
  party: PartyPersona;
  selected: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  disabled?: boolean;
  /** Grows to fill its flex row instead of sizing to content - for a flex-wrap layout with few items. */
  fullWidth?: boolean;
}

export default function PartyChip({
  party,
  selected,
  onClick,
  size = "md",
  showName = true,
  disabled = false,
  fullWidth = false,
}: PartyChipProps): React.JSX.Element {
  let avatarSize: number;
  if (size === "sm") {
    avatarSize = 40;
  } else if (size === "lg") {
    avatarSize = 72;
  } else {
    avatarSize = 56;
  }

  return (
    <button
      aria-pressed={selected}
      className={clsx("party-chip", selected && "selected", fullWidth && "flex-1 basis-32")}
      disabled={disabled}
      id={`party-chip-${party.id}`}
      onClick={onClick}
      style={{
        backgroundColor: selected ? party.color : "white",
        borderColor: selected ? party.color : "var(--border)",
        boxShadow: selected ? `5px 5px 0px ${party.color}88` : "3px 3px 0px var(--border)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled && !selected ? 0.6 : 1,
      }}
      title={`${party.displayName} (${party.partyName})`}
      type="button"
    >
      {/* Party color accent strip */}
      <div className="absolute start-0 end-0 top-0 h-1.5 rounded-t-[13px]" style={{ backgroundColor: party.color }} />

      {/* Avatar with Party Logo Badge */}
      <div className="mt-1">
        <PartyAvatar
          badgeClassName="absolute -bottom-1 -end-1 rounded-full bg-white border-2 border-black overflow-hidden flex items-center justify-center p-0.5 shadow-sm"
          badgeSize={Math.max(20, Math.round(avatarSize * 0.44))}
          className="relative overflow-hidden rounded-full border-2"
          party={party}
          size={avatarSize}
          style={{
            borderColor: selected ? "white" : "var(--border)",
            boxShadow: selected ? `0 0 0 2px ${party.color}` : "none",
          }}
        />
      </div>

      {/* Text */}
      {showName && (
        <div className="w-full text-center">
          <div
            className="truncate font-black text-sm leading-tight"
            style={{ color: selected ? "white" : "var(--color-ink)" }}
          >
            {party.displayName}
          </div>
          <div
            className="font-semibold text-xs leading-tight"
            style={{ color: selected ? "rgba(255,255,255,0.85)" : "#666" }}
          >
            {party.partyName}
          </div>
        </div>
      )}
    </button>
  );
}
