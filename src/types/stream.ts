export interface AskAllEvent {
  type: "answer" | "error" | "done";
  partyId?: string;
  text?: string;
  sources?: string[];
}
