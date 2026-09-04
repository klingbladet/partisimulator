export type PartyId = "parti-s" | "parti-m" | "parti-sd" | "parti-v" | "parti-c" | "parti-kd" | "parti-l" | "parti-mp";

export interface PartyPersona {
  id: PartyId;
  displayName: string;
  shortName: string;
  partyName: string;
  tone: string;
  rhetoricalStyle: string;
  keyIssues: string[];
  manifestSource: string;
  avatarFile: string;
  logoFile: string;
  color: string;
  textColor: string;
  abbreviation: string;
}
