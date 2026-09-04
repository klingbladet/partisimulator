"use client";

import clsx from "clsx";
import PartyAvatar from "@/components/party-avatar";
import type { PartyPersona } from "@/types/party";

interface PartyChipProps {
  party: PartyPersona;
  selected: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

export default function PartyChip({
  party,
  selected,
  onClick,
  size = "md",
  showName = true,
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
      className={clsx("party-chip", selected && "selected")}
      id={`party-chip-${party.id}`}
      onClick={onClick}
      style={{
        backgroundColor: selected ? party.color : "white",
        borderColor: selected ? party.color : "var(--border)",
        boxShadow: selected ? `5px 5px 0px ${party.color}88` : "3px 3px 0px var(--border)",
      }}
      title={`${party.displayName} (${party.partyName})`}
      type="button"
    >
      {/* Party color accent strip */}
      <div className="absolute top-0 right-0 left-0 h-1.5 rounded-t-[13px]" style={{ backgroundColor: party.color }} />

      {/* Avatar with Party Logo Badge */}
      <div className="mt-1">
        <PartyAvatar
          badgeClassName="absolute -bottom-1 -right-1 rounded-full bg-white border-2 border-black overflow-hidden flex items-center justify-center p-0.5 shadow-sm"
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
          <div className="font-black text-xs leading-tight" style={{ color: selected ? "white" : "var(--color-ink)" }}>
            {party.abbreviation}
          </div>
          <div
            className="font-semibold leading-tight"
            style={{
              color: selected ? "rgba(255,255,255,0.85)" : "#666",
              fontSize: "0.6rem",
              margin: "0 auto",
              maxWidth: "70px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {party.partyName}
          </div>
        </div>
      )}
    </button>
  );
}
