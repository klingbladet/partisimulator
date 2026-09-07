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

export interface AboutBeatEvent {
  type: "beat" | "cast" | "castDone" | "done";
  index?: number;
  heading?: string;
  text?: string;
  name?: string;
}
