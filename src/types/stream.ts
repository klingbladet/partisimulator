import type { Stance } from "@/lib/sources";

export interface AskAllEvent {
  type: "answer" | "error" | "done";
  partyId?: string;
  text?: string;
  longAnswer?: string;
  sources?: string[];
  stance?: Stance;
  manifestUrl?: string | null;
}
