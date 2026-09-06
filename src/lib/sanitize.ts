/**
 * Strippa all engelsk thinking-metadata, instruktionsblock och debug-rader
 * från AI-svar innan de sparas i historik eller skickas till frontend.
 */
export function sanitizeSpeech(rawText: string): string {
  if (!rawText) return "";

  let clean = rawText.replace(/Here's a thinking process:[\s\S]*?(?=\n[A-ZÅÄÖ]|\n\n|$)/gi, "");
  clean = clean.replace(/Analyze User Input:[\s\S]*?(?=\n[A-ZÅÄÖ]|\n\n|$)/gi, "");
  clean = clean.replace(/User Safety:[\s\S]*?$/gi, "");
  clean = clean.replace(/We need to produce[\s\S]*?\n/gi, "");
  clean = clean.replace(/^\d+\.\s+.*$/gm, "");
  clean = clean.replace(/^[a-zA-Z\s.,:'"()-]{15,}\n/gm, "");
  clean = clean.replace(/\n{3,}/g, "\n\n").trim();

  return clean;
}
