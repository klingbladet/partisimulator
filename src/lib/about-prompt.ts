import type { AboutContent } from "@/types/about";
import aboutContent from "./about.json";
import aboutNotes from "./about-notes.json";
import { MAKER_NAMES } from "./makers";

const ABOUT: AboutContent = aboutContent;

// A freeform scratchpad (plain array of strings, not categorized like about.json's per-beat
// lists) that anyone on the team can drop words or phrases into without touching the prompt code
// itself - optional inspiration, woven in everywhere rather than tied to one specific beat.
const NOTES: string[] = aboutNotes;
const notesLine =
  NOTES.length > 0
    ? `\nExtra inspiration, ord/fraser gänget gillar (väv in om det passar, tvinga inte in dem): ${NOTES.join(", ")}.`
    : "";

// Prompts describe WHAT each beat/entry should say but not HOW it should sound, which leaves a
// weaker model free to drift into stiff, essay-like Swedish. Applied everywhere except the
// "Vårt uppdrag" beat, which is deliberately the opposite: stiff corporate jargon is the joke.
const CASUAL_TONE =
  "Skriv informellt och avslappnat, som om du berättade högt för en kompis - korta meningar, vardagsspråk, inget skriftspråkigt eller uppstyltat.";

// MAKER_NAMES can be empty if MAKER_NAMES isn't set in the environment - the rule still needs to
// hold (never invent real personal info) even with no real names to allow-list.
const namesRule =
  MAKER_NAMES.length > 0
    ? `Använd ENDAST namnen ${MAKER_NAMES.join(", ")} om du nämner vilka "vi" är - hitta ALDRIG på ytterligare riktiga namn, efternamn eller annan riktig personinfo.`
    : `Hitta ALDRIG på riktiga namn eller annan riktig personinfo om vilka "vi" är.`;

interface StoryBeat {
  /** Reader-facing heading, shown above this beat's paragraph. */
  heading: string;
  /** The Daniel Calvisi Story Maps beat this corresponds to, or a note that it's outside that structure. */
  calvisiBeat: string;
  instruction: string;
  material?: string[];
  /** True only for the mission-statement beat, whose whole joke is stiff corporate jargon. */
  skipCasualTone?: boolean;
}

/**
 * One LLM call per beat (see buildAboutBeatPrompt) instead of one call asked to produce all of
 * them: a single free-form completion has no way to force the model to actually move on once it
 * starts rambling on an early beat, so - same reasoning as capping party replies in code rather
 * than trusting the prompt - each beat gets its own call with its own hard length cap, guaranteeing
 * every heading gets real content instead of the story dying out partway through.
 *
 * Follows Daniel Calvisi's Story Maps beat order (Opening -> Inciting Incident -> Turn &
 * Decision -> First Trial -> Midpoint -> End of Act Two Turn -> Climax/Resolution), plus two
 * beats outside that structure for the genre's other favorite clichés: a bombastic mission
 * statement, and a quotable closing line.
 */
const STORY_BEATS: StoryBeat[] = [
  {
    calvisiBeat: "Opening",
    heading: "Vilka vi är",
    instruction:
      "Beskriv gänget kollektivt - stämningen, energin, vad som gör er ett gäng och inte bara fyra individer. Nämn INTE enskilda titlar eller vem som gör vad - det har rollistan redan täckt.",
  },
  {
    calvisiBeat: "Opening (bakgrund)",
    heading: "Vår historia - så möttes vi",
    instruction: "Berätta hur ni träffades, gärna med en absurd twist.",
    material: ABOUT.howTheyMet,
  },
  {
    calvisiBeat: "Opening (status quo)",
    heading: "Vad vi bygger",
    instruction: "Vad ni höll på med: att bygga PartiSimulator 2026 som skolprojekt.",
  },
  {
    calvisiBeat: "Inciting Incident",
    heading: "Gnistan",
    instruction: "Något som satte igång alltihop.",
    material: ABOUT.incitingIncidents,
  },
  {
    calvisiBeat: "Turn & Decision",
    heading: "Beslutet",
    instruction: "Vad ni insåg att ni var tvungna att lösa.",
    material: ABOUT.goals,
  },
  {
    calvisiBeat: "First Trial",
    heading: "Första bakslaget",
    instruction: "Vad som sedan gick snett på vägen.",
    material: ABOUT.complications,
  },
  {
    calvisiBeat: "Midpoint",
    heading: "Vändpunkten",
    instruction: "En höjdpunkt, en liten seger.",
    material: ABOUT.wins,
  },
  {
    calvisiBeat: "End of Act Two Turn",
    heading: "Katastrofen",
    instruction: "Ett bakslag, strax efter höjdpunkten.",
    material: ABOUT.setbacks,
  },
  {
    calvisiBeat: "Climax/Resolution",
    heading: "Upplösningen",
    instruction: "Runda av med en ironisk twist på hur ni ändå landade här - fortfarande bara ett skolprojekt.",
  },
  {
    calvisiBeat: "bonusklyscha, ej del av Story Maps",
    heading: "Vårt uppdrag",
    instruction:
      "En bombastisk, uppblåst uppdrags- och visionsförklaring i renaste startup-jargong - så överdrivet högtravande som möjligt för ett skolprojekt.",
    material: ABOUT.buzzwords,
    skipCasualTone: true,
  },
  {
    calvisiBeat: "signaturrad, ej del av Story Maps",
    heading: "Sista ordet",
    instruction:
      "EN enda, kort, catchy och nästan eftertänksam avslutningsrad - något man skulle kunna sätta på en vägg eller citera. Bryt gärna tonen: mindre buzzword, mer genuin (om än självironisk) eftertanke.",
  },
];

export const ABOUT_STORY_HEADINGS = STORY_BEATS.map((beat) => beat.heading);
export const ABOUT_STORY_BEAT_COUNT = STORY_BEATS.length;

/**
 * Builds the system prompt for a single beat of the "about us" story (used by /api/about, one
 * call per beat). previousBeatTexts is every beat already generated this run, in order, so each
 * new beat continues naturally instead of contradicting or repeating what came before - the same
 * "feed prior turns back in for continuity" approach buildDebatePrompt uses for conversation
 * history.
 */
export function buildAboutBeatPrompt(beatIndex: number, previousBeatTexts: string[]): string {
  const currentBeat = STORY_BEATS[beatIndex];
  if (!currentBeat) {
    throw new Error(`Okänt about-beat-index: ${beatIndex}`);
  }
  const materialLine = currentBeat.material
    ? `\nInspiration (välj EN, eller hitta på egen i samma anda): ${currentBeat.material.join(" / ")}.`
    : "";
  const historySection =
    previousBeatTexts.length === 0
      ? "Detta är historiens allra första del - inget att bygga vidare på ännu."
      : `HISTORIEN HITTILLS (skriven av dig - fortsätt naturligt därifrån, upprepa INGET av detta):\n${previousBeatTexts.join("\n\n")}`;

  return [
    `Du är en munter, självironisk berättarröst som beskriver "oss" - skaparna bakom PartiSimulator 2026, ett skolprojekt gjort för skojs skull, inte en riktig produkt eller ett riktigt företag.`,
    historySection,
    `Skriv NÄSTA del av historien - steget "${currentBeat.heading}" (motsvarar Story Maps-beatet "${currentBeat.calvisiBeat}"): ${currentBeat.instruction}${materialLine}${notesLine}`,
    `Max två meningar. Skriv ENDAST brödtexten för detta steg - ingen rubrik, inget nummer, inga citattecken eller asterisker runt svaret, ingen inledande mening som förklarar vad du ska göra (t.ex. "Här är nästa del:") - bara själva texten, rakt av.`,
    ...(currentBeat.skipCasualTone ? [] : [CASUAL_TONE]),
    `REGLER:
- Skriv ALLTID på svenska.
- Hitta på NYA detaljer - upprepa aldrig en formulering du redan använt i den här historien.
- ${namesRule}
- Låtsas ALDRIG vara ett riktigt företag eller en seriös "om oss"-sida - det ska vara uppenbart skämtsamt.
- Börja aldrig med artighetsfraser eller en introduktion av dig själv som AI - gå rakt in i texten.`,
  ].join("\n\n");
}

/**
 * Builds the system prompt for one cast-list entry (used by /api/about, one independent call per
 * name in parallel - unlike the story beats, these don't depend on each other, so there's no
 * continuity to feed between calls).
 */
export function buildCastEntryPrompt(name: string): string {
  return [
    `Du sätter ihop en rollista, i stil med filmens eftertexter, för "oss" - skaparna bakom PartiSimulator 2026, ett skolprojekt gjort för skojs skull.`,
    `Skriv en kort, skrytsam "boast"-text om personen "${name}" - som om ni skrev en överdriven hjälte-bio om varandra. Väv ihop en absurd titel/expertis och en orimlig erfarenhetsknorr till EN sammanhängande text, i tredje person, och nämn "${name}" vid namn minst en gång.
Inspiration att väva in (tvinga inte in exakt dessa ord, hitta gärna på egna i samma anda):
- Titlar/expertis: ${ABOUT.professions.join(", ")}.
- Erfarenhetsknorrar: ${ABOUT.experienceJokes.join(", ")}.${notesLine}`,
    `Exempel (hitta INTE på samma innehåll, bara samma FORM och ton):
"Ingen kan vibekoda som Namn. Med 25 års erfarenhet från LLM:er visar han gång på gång att det inte handlar om kunskap, utan om tokens och API-nycklar."`,
    `FORMAT: EN sammanhängande text, max två meningar, inget annat. Ingen rubrik, inget namn först på egen rad (namnet ska vara en del av själva texten, inte en etikett), inga citattecken, inga asterisker, ingen inledande mening som förklarar vad du ska göra (t.ex. "Här är texten för...") - bara texten, rakt av.`,
    CASUAL_TONE,
    `REGLER:
- Skriv ALLTID på svenska.
- Hitta på något nytt varje gång - upprepa aldrig samma formulering.
- Låtsas ALDRIG att detta är en riktig meritförteckning - uppenbart skämtsamt.`,
  ].join("\n\n");
}
