"use client";

import Image from "next/image";
import { PartyPersona } from "@/lib/parties";

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
}: DebateStageProps) {
  const count = parties.length;
  const charWidth =
    count <= 3
      ? "w-16 sm:w-20"
      : count <= 5
      ? "w-13 sm:w-16"
      : "w-10 sm:w-13";

  const charHeight =
    count <= 3
      ? "h-22 sm:h-28"
      : count <= 5
      ? "h-18 sm:h-24"
      : "h-16 sm:h-20";

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-2xl border-2 border-black bg-black/65 backdrop-blur-md shadow-[4px_4px_0px_#1a1a1a] p-2.5 sm:p-3 select-none">
      {/* Top TV Chyron / Topic Bar */}
      <div className="flex items-center justify-between gap-2 mb-1.5 px-1 border-b border-white/20 pb-1.5">
        <div className="flex items-center gap-1.5 text-white font-black text-xs">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span className="tracking-wider uppercase text-[10px] sm:text-[11px] opacity-90">
            Riksdagsdebatt
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/90 text-xs font-bold truncate max-w-[65%]">
          <span>💡</span>
          <span className="truncate text-[11px]">&quot;{topic}&quot;</span>
        </div>
      </div>

      {/* Compact Standing Politicians Row */}
      <div className="w-full flex items-end justify-around px-1 sm:px-3 pt-1">
        {parties.map((party) => {
          const isSpeaking = currentSpeakerId === party.id;

          return (
            <div
              key={party.id}
              onClick={() => !isLoading && onSelectSpeaker(party.id)}
              className={`group relative flex flex-col items-center transition-all duration-200 ${
                isSpeaking
                  ? "scale-110 -translate-y-1.5 z-20"
                  : "opacity-85 hover:opacity-100 hover:scale-105 z-10 cursor-pointer"
              }`}
              title={`Klicka för att låta ${party.displayName} (${party.partyName}) tala`}
            >
              {/* Speaker Spotlight Glow */}
              {isSpeaking && (
                <div
                  className="absolute inset-0 -bottom-1 rounded-full blur-md opacity-80 pointer-events-none animate-pulse"
                  style={{ backgroundColor: party.color }}
                />
              )}

              {/* Speech Indicator Badge above head */}
              {isSpeaking && (
                <div
                  className="absolute -top-6 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black border border-white shadow-lg animate-bounce z-30 whitespace-nowrap"
                  style={{ backgroundColor: party.color, color: party.textColor }}
                >
                  <span className="text-[10px]">🎙️</span>
                  <span className="text-[9px] uppercase tracking-wider">
                    {isLoading ? "Talar..." : "Talar"}
                  </span>
                </div>
              )}

              {/* Character Cutout - Standardized 5:8 aspect ratio */}
              <div className={`relative ${charHeight} aspect-[5/8] flex-shrink-0`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/avatars/${party.avatarFile}`}
                  alt={party.displayName}
                  className={`w-full h-full object-contain object-bottom filter transition-all ${
                    isSpeaking
                      ? "drop-shadow-[0_4px_8px_rgba(255,255,255,0.4)]"
                      : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
                  }`}
                />
              </div>

              {/* Compact Nameplate at Feet */}
              <div
                className="mt-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded border border-black shadow-xs font-black z-10 transition-colors"
                style={{
                  backgroundColor: isSpeaking ? party.color : "#ffffff",
                  color: isSpeaking ? party.textColor : "#1a1a1a",
                }}
              >
                {party.logoFile && (
                  <span className="relative w-3 h-3 rounded-full bg-white p-0.2 inline-flex items-center justify-center overflow-hidden border border-black/20 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/logos/${party.logoFile}`}
                      alt={party.partyName}
                      className="w-full h-full object-contain"
                    />
                  </span>
                )}
                <span className="truncate max-w-[50px] sm:max-w-[75px] text-[9px] sm:text-[10px]">
                  {party.displayName.split(" ")[0]} ({party.abbreviation})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
