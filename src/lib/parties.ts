import type { PartyId, PartyPersona } from "@/types/party";
import partiesData from "./parties.json";

const VALID_PARTY_IDS: readonly string[] = [
  "parti-s",
  "parti-m",
  "parti-sd",
  "parti-v",
  "parti-c",
  "parti-kd",
  "parti-l",
  "parti-mp",
  "parti-shrek",
];

/** Test-only parties, hidden from the default experience unless SHREK=true. */
const TEST_PARTY_IDS: ReadonlySet<PartyId> = new Set(["parti-shrek"]);
const showTestParties = process.env.SHREK === "true";

function isPartyId(id: string): id is PartyId {
  return VALID_PARTY_IDS.includes(id);
}

/**
 * Validates and narrows a raw parties.json entry's id against PartyId, so a typo fails fast at startup.
 * Also maps parties.json's reader-facing field names ("name", "leader") onto PartyPersona's
 * ("partyName", "displayName"), which the rest of the app already depends on.
 */
function parseParty(raw: (typeof partiesData)[number]): PartyPersona {
  if (!isPartyId(raw.id)) {
    throw new Error(`Okänt parti-id i parties.json: "${raw.id}"`);
  }
  const { name, leader, ...rest } = raw;
  return { ...rest, displayName: leader, id: raw.id, partyName: name };
}

export const PARTIES: PartyPersona[] = partiesData
  .map(parseParty)
  .filter((party) => showTestParties || !TEST_PARTY_IDS.has(party.id));

export const PARTY_MAP: Record<PartyId, PartyPersona> = Object.fromEntries(
  PARTIES.map((party) => [party.id, party]),
) as Record<PartyId, PartyPersona>;

export function getParty(id: string): PartyPersona | undefined {
  // Validate before indexing: PARTY_MAP is a plain object, so a raw, unchecked id like "__proto__"
  // or "constructor" would resolve to Object.prototype instead of undefined.
  return isPartyId(id) ? PARTY_MAP[id] : undefined;
}
