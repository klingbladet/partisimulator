import type { Stance } from "@/lib/sources";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  stance?: Stance;
  manifestUrl?: string | null;
  /** Set when `text` is the no-answer fallback rather than a real reply, so it can be regenerated. */
  isError?: boolean;
}
