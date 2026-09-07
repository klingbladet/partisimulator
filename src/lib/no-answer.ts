import type { PartyPersona } from "@/types/party";

export interface NoAnswerFallback {
  text: string;
  manifestUrl: string | null;
}

/**
 * Shown instead of a dropped or blank reply when nothing usable came back from the model - the
 * request failed outright, or sanitizeSpeech had to strip a leaked/garbled response down to
 * nothing. Keeps the party in character and points at its real manifesto rather than leaving a
 * dead bubble or silence. Träskpartiet has no real manifesto to link to, so it gets its own line.
 */
export function buildNoAnswerFallback(party: PartyPersona): NoAnswerFallback {
  if (party.id === "parti-shrek") {
    return {
      manifestUrl: null,
      text: "Shrek grymtar irriterat och sjunker ner i träsket - fråga igen om en stund.",
    };
  }
  return {
    manifestUrl: `/manifests/${party.manifestSource}`,
    text: "Jag kan inte svara på det just nu, men svaret finns garanterat i vårt valmanifest.",
  };
}
