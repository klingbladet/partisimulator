"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { PartyPersona } from "@/types/party";

interface PartyAvatarProps {
  party: PartyPersona;
  size: number;
  badgeSize?: number;
  className?: string;
  style?: CSSProperties;
  badgeClassName?: string;
}

/** Circular party avatar with an optional logo badge overlay, shared across the answer/debate bubbles, the party chip, and the speaker selector. */
export default function PartyAvatar({
  party,
  size,
  badgeSize = Math.max(13, Math.round(size * 0.44)),
  className = "relative rounded-full overflow-hidden border-2 border-black",
  style,
  badgeClassName = "absolute -bottom-1 -end-1 rounded-full bg-white border border-black overflow-hidden flex items-center justify-center p-0.5",
}: PartyAvatarProps): React.JSX.Element {
  return (
    <div className="relative flex-shrink-0">
      <div className={className} style={{ height: size, width: size, ...style }}>
        <Image
          alt={party.displayName}
          className="object-cover object-top"
          fill
          sizes={`${size}px`}
          src={`/assets/characters/${party.avatarFile}`}
        />
      </div>

      {party.logoFile && (
        <div
          className={badgeClassName}
          style={{ height: badgeSize, width: badgeSize }}
          title={`${party.partyName} logotyp`}
        >
          <div className="relative h-full w-full">
            <Image
              alt={`${party.partyName} logotyp`}
              className="object-contain"
              fill
              sizes={`${badgeSize}px`}
              src={`/assets/logos/${party.logoFile}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
