import type { Stance } from "@/lib/sources";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  stance?: Stance;
}
