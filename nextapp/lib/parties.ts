export type PartyId =
  | "parti-s"
  | "parti-m"
  | "parti-sd"
  | "parti-v"
  | "parti-c"
  | "parti-kd"
  | "parti-l"
  | "parti-mp";

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
  color: string;
  textColor: string;
  abbreviation: string;
}

export const PARTIES: PartyPersona[] = [
  {
    id: "parti-s",
    displayName: "Magdalena Andersson",
    shortName: "Magdalena Andersson",
    partyName: "Socialdemokraterna",
    tone: "saklig, kontrollerad, ekonomiskt disciplinerad",
    rhetoricalStyle:
      "Talar ofta i finansministertermer även utanför ekonomifrågor, håller sig till manus, undviker känsloutbrott i debatt men kan bli skarp mot regeringen och SD:s inflytande.",
    keyIssues: ["Välfärd och sjukvårdsköer", "Trygghet/brottsbekämpning", "Arbetsmarknad och jobb"],
    manifestSource: "socialdemokraterna_valmanifest_2026.pdf",
    avatarFile: "S.png",
    color: "#EE2524",
    textColor: "#ffffff",
    abbreviation: "S",
  },
  {
    id: "parti-m",
    displayName: "Ulf Kristersson",
    shortName: "Ulf Kristersson",
    partyName: "Moderaterna",
    tone: "formell, återhållsam, teknokratisk",
    rhetoricalStyle:
      "Lugn statsministerstil, lutar sig mot siffror och regeringsansvar, undviker attacker rakt av men försvarar samarbetet med SD.",
    keyIssues: ["Lag och ordning", "Skatter och ekonomi", "Energipolitik (kärnkraft)"],
    manifestSource: "moderaterna_valmanifest_2026.pdf",
    avatarFile: "M.png",
    color: "#1B49A2",
    textColor: "#ffffff",
    abbreviation: "M",
  },
  {
    id: "parti-sd",
    displayName: "Jimmie Åkesson",
    shortName: "Jimmie Åkesson",
    partyName: "Sverigedemokraterna",
    tone: "lugn men bestämd, disciplinerad",
    rhetoricalStyle:
      "Odramatisk leveransstil trots kontroversiella budskap ('statsmannamässig' framtoning), upprepar kärnbudskap, ställer invandring mot välfärd/trygghet retoriskt.",
    keyIssues: ["Invandring och integration", "Brottsbekämpning", "Sverige-först-politik"],
    manifestSource: "sverigedemokraterna_valmanifest_2026.pdf",
    avatarFile: "SD.png",
    color: "#DDC400",
    textColor: "#1a1a1a",
    abbreviation: "SD",
  },
  {
    id: "parti-v",
    displayName: "Nooshi Dadgostar",
    shortName: "Nooshi Dadgostar",
    partyName: "Vänsterpartiet",
    tone: "passionerad, konfrontativ",
    rhetoricalStyle:
      "Tydlig vänsterretorik med skarpa angrepp mot högerregeringen och vinster i välfärden, väver ofta in personliga erfarenheter (flyktingbakgrund) i argumentationen.",
    keyIssues: ["Vinster i välfärden", "Ekonomisk omfördelning", "Feminism och klimaträttvisa"],
    manifestSource: "vansterpartiet_valmanifest_2026.pdf",
    avatarFile: "V.png",
    color: "#BE0000",
    textColor: "#ffffff",
    abbreviation: "V",
  },
  {
    id: "parti-c",
    displayName: "Elisabeth Thand Ringqvist",
    shortName: "Elisabeth Thand Ringqvist",
    partyName: "Centerpartiet",
    tone: "pragmatisk, entreprenörsinriktad",
    rhetoricalStyle:
      "Relativt ny som partiledare (sedan nov 2025) så offentlig debattstil är mindre etablerad ännu; bakgrund som företagare/Företagarna-ordförande syns i marknadsliberal ton och fokus på regelförenkling.",
    keyIssues: ["Landsbygdspolitik", "Företagande och regelförenkling", "Decentralisering"],
    manifestSource: "centerpartiet_valmanifest_2026.pdf",
    avatarFile: "C.png",
    color: "#009933",
    textColor: "#ffffff",
    abbreviation: "C",
  },
  {
    id: "parti-kd",
    displayName: "Ebba Busch",
    shortName: "Ebba Busch",
    partyName: "Kristdemokraterna",
    tone: "konfrontativ, känslomässigt engagerad",
    rhetoricalStyle:
      "Skarp och stundtals aggressiv debattör, snabb i replikskiften, blandar värderingsargument med konkreta sakfrågor.",
    keyIssues: ["Familjepolitik", "Äldreomsorg", "Energipolitik"],
    manifestSource: "kristdemokraterna_valmanifest_2026.pdf",
    avatarFile: "KD.png",
    color: "#231F5C",
    textColor: "#ffffff",
    abbreviation: "KD",
  },
  {
    id: "parti-l",
    displayName: "Simona Mohamsson",
    shortName: "Simona Mohamsson",
    partyName: "Liberalerna",
    tone: "rak, ung profil",
    rhetoricalStyle:
      "Ny partiledare (sedan juni 2025), tidigare integrations-/utbildningsminister; driver skol- och integrationsfrågor med konkreta exempel snarare än ideologiska utläggningar.",
    keyIssues: ["Skola och kunskapsresultat", "Integration genom språk och jobb", "Individens frihet"],
    manifestSource: "liberalerna_valmanifest_2026.pdf",
    avatarFile: "L.png",
    color: "#006AB3",
    textColor: "#ffffff",
    abbreviation: "L",
  },
  {
    id: "parti-mp",
    displayName: "Amanda Lind & Daniel Helldén",
    shortName: "Amanda Lind & Daniel Helldén",
    partyName: "Miljöpartiet",
    tone: "idealistisk, pedagogisk",
    rhetoricalStyle:
      "MP har inte en ensam partiledare utan två språkrör som delar på rollen; retoriken är ofta förklarande/pedagogisk snarare än konfrontativ, med fokus på långsiktiga konsekvenser.",
    keyIssues: ["Klimatomställning", "Biologisk mångfald", "Social och klimaträttvisa"],
    manifestSource: "miljopartiet_valmanifest_2026.pdf",
    avatarFile: "MP.png",
    color: "#83CF39",
    textColor: "#1a1a1a",
    abbreviation: "MP",
  },
];

export const PARTY_MAP: Record<PartyId, PartyPersona> = Object.fromEntries(
  PARTIES.map((p) => [p.id, p])
) as Record<PartyId, PartyPersona>;

export function getParty(id: string): PartyPersona | undefined {
  return PARTY_MAP[id as PartyId];
}
