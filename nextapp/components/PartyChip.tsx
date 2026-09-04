"use client";

import Image from "next/image";
import { PartyPersona } from "@/lib/parties";
import clsx from "clsx";

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
}: PartyChipProps) {
  const avatarSize = size === "sm" ? 40 : size === "lg" ? 72 : 56;

  return (
    <button
      onClick={onClick}
      className={clsx("party-chip", selected && "selected")}
      style={{
        backgroundColor: selected ? party.color : "white",
        borderColor: selected ? party.color : "var(--border)",
        boxShadow: selected
          ? `5px 5px 0px ${party.color}88`
          : "3px 3px 0px var(--border)",
      }}
      title={`${party.displayName} (${party.partyName})`}
      aria-pressed={selected}
      id={`party-chip-${party.id}`}
    >
      {/* Party color accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[13px]"
        style={{ backgroundColor: party.color }}
      />

      {/* Avatar with Party Logo Badge */}
      <div className="relative mt-1">
        <div
          className="relative rounded-full overflow-hidden border-2"
          style={{
            width: avatarSize,
            height: avatarSize,
            borderColor: selected ? "white" : "var(--border)",
            boxShadow: selected ? "0 0 0 2px " + party.color : "none",
            flexShrink: 0,
          }}
        >
          <Image
            src={`/avatars/${party.avatarFile}`}
            alt={party.displayName}
            fill
            className="object-cover object-top"
            sizes={`${avatarSize}px`}
          />
        </div>

        {/* Official Party Logo Badge */}
        {party.logoFile && (
          <div
            className="absolute -bottom-1 -right-1 rounded-full bg-white border-2 border-black overflow-hidden flex items-center justify-center p-0.5 shadow-sm"
            style={{
              width: Math.max(20, Math.round(avatarSize * 0.44)),
              height: Math.max(20, Math.round(avatarSize * 0.44)),
            }}
            title={`${party.partyName} logotyp`}
          >
            <div className="relative w-full h-full">
              <Image
                src={`/logos/${party.logoFile}`}
                alt={`${party.partyName} logotyp`}
                fill
                className="object-contain"
                sizes="24px"
              />
            </div>
          </div>
        )}
      </div>

      {/* Text */}
      {showName && (
        <div className="text-center w-full">
          <div
            className="font-black text-xs leading-tight"
            style={{ color: selected ? "white" : "var(--color-ink)" }}
          >
            {party.abbreviation}
          </div>
          <div
            className="font-semibold leading-tight"
            style={{
              fontSize: "0.6rem",
              color: selected ? "rgba(255,255,255,0.85)" : "#666",
              maxWidth: "70px",
              margin: "0 auto",
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
