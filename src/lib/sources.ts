const SOURCE_MARKER = /\[KÄLLA:[^\]]+\]/g;

export function extractSources(text: string): string[] {
  return text.match(SOURCE_MARKER) || [];
}

export function cleanText(text: string): string {
  return text.replace(SOURCE_MARKER, "").trim();
}
