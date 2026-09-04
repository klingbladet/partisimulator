const EXAMPLE_QUESTIONS: readonly string[] = [
  "Hur ska Sverige bekämpa brottsligheten?",
  "Vad vill ni göra åt bostadsbristen?",
  "Hur ser er politik ut för att sänka arbetslösheten?",
  "Vad tycker ni om vinster i välfärden?",
  "Hur vill ni lösa personalbristen inom vården?",
  "Vad är er politik för att minska klimatutsläppen?",
  "Hur ska Sverige klara elförsörjningen framöver?",
  "Vad vill ni göra åt de höga elpriserna?",
  "Hur ser er politik ut för skolan och lärarnas villkor?",
  "Vad tycker ni om Sveriges invandringspolitik?",
  "Hur vill ni stärka Sveriges försvar?",
  "Vad är er politik för äldreomsorgen?",
  "Hur vill ni sänka skatten för vanligt folk?",
  "Vad tycker ni om marknadshyror på bostäder?",
  "Hur ska Sverige minska segregationen?",
  "Vad är er politik för småföretagare?",
  "Hur vill ni förbättra kollektivtrafiken?",
  "Vad tycker ni om vapenexport från Sverige?",
  "Hur ska Sverige hantera den psykiska ohälsan bland unga?",
  "Vad är er politik för jordbruket och matproduktionen?",
];

/** Picks one example political question at random, used by the "Slumpa fråga" button. */
export function getRandomExampleQuestion(): string {
  const randomIndex = Math.floor(Math.random() * EXAMPLE_QUESTIONS.length);
  return EXAMPLE_QUESTIONS[randomIndex] as string;
}
