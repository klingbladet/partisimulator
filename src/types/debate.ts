export interface DebateEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  sources: string[];
  manifestUrl?: string | null;
  /** Set when `text` is the no-answer fallback rather than a real reply, so it can be regenerated. */
  isError?: boolean;
  /** Set when this was a closing-round turn, so regenerating it sends the same request shape again. */
  isClosingStatement?: boolean;
}
