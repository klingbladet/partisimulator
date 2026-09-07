const SOURCE_MARKER = /\[KÄLLA:[^\]]+\]/g;
const STANCE_MARKER = /\[STÅNDPUNKT:\s*(FÖR|EMOT|NEUTRALT)\]/i;
// Broader than STANCE_MARKER: also matches a malformed or truncated marker (e.g. a model cutting
// "FÖR" short as "FÖ"), so stripping never leaves raw [STÅNDPUNKT: ...] text visible to the user.
const STANCE_MARKER_ANY = /\[STÅNDPUNKT:[^\]]*\]/gi;
// Matches an in-progress marker that's still streaming in and hasn't reached its closing "]" yet,
// so the partial fragment (e.g. "[STÅNDPUNKT: F") doesn't flash on screen as real answer text
// for the moment before it completes.
const PARTIAL_STANCE_MARKER_PREFIX = /^\[STÅNDPUNKT(?::[^\]]*)?$/i;
const LONG_ANSWER_MARKER = "[LÅNGT SVAR]";

export type Stance = "for" | "emot" | "neutralt";

export function extractSources(text: string): string[] {
  return text.match(SOURCE_MARKER) || [];
}

export function cleanText(text: string): string {
  return text.replace(SOURCE_MARKER, "").trim();
}

/** Reads the model's self-reported [STÅNDPUNKT: ...] marker, used to render the Agree/Disagree/Neutral meter. */
export function extractStance(text: string): Stance | undefined {
  const match = text.match(STANCE_MARKER);
  const value = match?.[1]?.toUpperCase();
  if (value === "FÖR") return "for";
  if (value === "EMOT") return "emot";
  if (value === "NEUTRALT") return "neutralt";
  return undefined;
}

export function stripStanceMarker(text: string): string {
  const trimmed = text.trim();
  if (PARTIAL_STANCE_MARKER_PREFIX.test(trimmed)) return "";
  return trimmed.replace(STANCE_MARKER_ANY, "").trim();
}

/** Splits an ask-all answer into its short (default-visible) and long (drawer) parts at the [LÅNGT SVAR] marker. */
export function splitShortLong(text: string): { short: string; long: string | undefined } {
  const index = text.indexOf(LONG_ANSWER_MARKER);
  if (index === -1) {
    return { long: undefined, short: text.trim() };
  }
  return {
    long: text.slice(index + LONG_ANSWER_MARKER.length).trim(),
    short: text.slice(0, index).trim(),
  };
}
