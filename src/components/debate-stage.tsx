"use client";

import Image from "next/image";
import type { PartyPersona } from "@/types/party";

interface StageCharacterProps {
  party: PartyPersona;
  isSpeaking: boolean;
  isLoading: boolean;
  charHeight: string;
  onSelect: (partyId: string) => void;
}

function StageCharacter({
  party,
  isSpeaking,
  isLoading,
  charHeight,
  onSelect,
}: StageCharacterProps): React.JSX.Element {
  return (
    <button
      className={`group relative flex flex-col items-center transition-all duration-200 ${
        isSpeaking
          ? "z-20 -translate-y-1.5 scale-110"
          : "z-10 cursor-pointer opacity-85 hover:scale-105 hover:opacity-100"
      }`}
      disabled={isLoading}
      onClick={() => onSelect(party.id)}
      title={`Klicka för att låta ${party.displayName} (${party.partyName}) tala`}
      type="button"
    >
      {/* Speaker Spotlight Glow */}
      {isSpeaking && (
        <div
          className="pointer-events-none absolute inset-0 -bottom-1 animate-pulse rounded-full opacity-80 blur-md"
          style={{ backgroundColor: party.color }}
        />
      )}

      {/* Speech Indicator Badge above head */}
      {isSpeaking && (
        <div
          className="absolute -top-6 z-30 flex animate-bounce items-center gap-1 whitespace-nowrap rounded-full border border-white px-2 py-0.5 font-black text-xs shadow-lg"
          style={{ backgroundColor: party.color, color: party.textColor }}
        >
          <span className="text-[10px]">🎙️</span>
          <span className="text-[9px] uppercase tracking-wider">{isLoading ? "Talar..." : "Talar"}</span>
        </div>
      )}

      {/* Character Cutout - Standardized 5:8 aspect ratio */}
      <div className={`relative ${charHeight} aspect-[5/8] flex-shrink-0`}>
        <Image
          alt={party.displayName}
          className={`object-contain object-bottom filter transition-all ${
            isSpeaking ? "drop-shadow-[0_4px_8px_rgba(255,255,255,0.4)]" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
          }`}
          fill
          sizes="80px"
          src={`/assets/characters/${party.avatarFile}`}
        />
      </div>

      {/* Compact Nameplate at Feet */}
      <div
        className="z-10 mt-0.5 flex items-center gap-1 rounded border border-black px-1.5 py-0.5 font-black shadow-xs transition-colors"
        style={{
          backgroundColor: isSpeaking ? party.color : "#ffffff",
          color: isSpeaking ? party.textColor : "#1a1a1a",
        }}
      >
        {party.logoFile && (
          <span className="relative inline-flex h-3 w-3 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-white p-0.2">
            <Image
              alt={party.partyName}
              className="object-contain"
              fill
              sizes="12px"
              src={`/assets/logos/${party.logoFile}`}
            />
          </span>
        )}
        <span className="max-w-[50px] truncate text-[9px] sm:max-w-[75px] sm:text-[10px]">
          {party.displayName.split(" ")[0] ?? party.displayName} ({party.abbreviation})
        </span>
      </div>
    </button>
  );
}

interface DebateStageProps {
  parties: PartyPersona[];
  currentSpeakerId: string | null;
  isLoading: boolean;
  topic: string;
  onSelectSpeaker: (partyId: string) => void;
}

export default function DebateStage({
  parties,
  currentSpeakerId,
  isLoading,
  topic,
  onSelectSpeaker,
}: DebateStageProps): React.JSX.Element {
  const count = parties.length;

  let charHeight: string;
  if (count <= 3) {
    charHeight = "h-22 sm:h-28";
  } else if (count <= 5) {
    charHeight = "h-18 sm:h-24";
  } else {
    charHeight = "h-16 sm:h-20";
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl select-none rounded-2xl border-2 border-black bg-black/65 p-2.5 shadow-[4px_4px_0px_#1a1a1a] backdrop-blur-md sm:p-3">
      {/* Top TV Chyron / Topic Bar */}
      <div className="mb-1.5 flex items-center justify-between gap-2 border-white/20 border-b px-1 pb-1.5">
        <div className="flex items-center gap-1.5 font-black text-white text-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
          <span className="text-[10px] uppercase tracking-wider opacity-90 sm:text-[11px]">Riksdagsdebatt</span>
        </div>
        <div className="flex max-w-[65%] items-center gap-1 truncate font-bold text-white/90 text-xs">
          <span>💡</span>
          <span className="truncate text-[11px]">&quot;{topic}&quot;</span>
        </div>
      </div>

      {/* Compact Standing Politicians Row */}
      <div className="flex w-full items-end justify-around px-1 pt-1 sm:px-3">
        {parties.map((party) => (
          <StageCharacter
            charHeight={charHeight}
            isLoading={isLoading}
            isSpeaking={currentSpeakerId === party.id}
            key={party.id}
            onSelect={onSelectSpeaker}
            party={party}
          />
        ))}
      </div>
    </div>
  );
}
