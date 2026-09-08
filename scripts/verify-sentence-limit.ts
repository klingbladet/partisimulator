import { limitToSentences } from "../src/lib/sentence-limit";

interface Case {
  name: string;
  input: string;
  maxSentences: number;
  expected: string;
}

const cases: Case[] = [
  {
    expected: "Vi menar t.ex. att skolan är viktig.",
    input: "Vi menar t.ex. att skolan är viktig. Dessutom vill vi satsa på vård.",
    maxSentences: 1,
    name: "abbreviation mid-sentence does not trip the cap",
  },
  {
    expected: "Vi vill satsa mer på skolan, t.ex. Det är vår högsta prioritet.",
    input: "Vi vill satsa mer på skolan, t.ex. Det är vår högsta prioritet.",
    maxSentences: 1,
    name: "abbreviation at the very end of the allowed text still cuts after it",
  },
  {
    expected: "Vi vill satsa på bl.a. skolan och m.fl. viktiga områden.",
    input: "Vi vill satsa på bl.a. skolan och m.fl. viktiga områden. Det är vår plan.",
    maxSentences: 1,
    name: "multiple abbreviations in one sentence",
  },
  {
    expected: "Vi vill satsa på skolan, t.ex. genom fler lärare. Dessutom vill vi satsa på vård.",
    input:
      "Vi vill satsa på skolan, t.ex. genom fler lärare. Dessutom vill vi satsa på vård. Sist vill vi sänka skatten.",
    maxSentences: 2,
    name: "two sentence cap still stops at the second real boundary",
  },
  {
    expected: "Är detta rätt väg? Ja!",
    input: "Är detta rätt väg? Ja! Vi tror det.",
    maxSentences: 2,
    name: "question and exclamation marks are unaffected",
  },
  {
    expected: "Vi menar t.ex. att skolan är viktig",
    input: "Vi menar t.ex. att skolan är viktig",
    maxSentences: 1,
    name: "no boundary found returns full text unchanged",
  },
  {
    expected: "Vi gillar A.W.E.S.O.M.-O väldigt mycket.",
    input: "Vi gillar A.W.E.S.O.M.-O väldigt mycket. Det är sant.",
    maxSentences: 1,
    name: "mid-word dot (non-abbreviation) still ignored, e.g. acronym-like token",
  },
];

let failures = 0;

for (const testCase of cases) {
  const actual = limitToSentences(testCase.input, testCase.maxSentences);
  const pass = actual === testCase.expected;
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"} - ${testCase.name}`);
  if (!pass) {
    console.log(`  expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`  actual:   ${JSON.stringify(actual)}`);
  }
}

console.log(`\n${cases.length - failures}/${cases.length} passed`);
if (failures > 0) process.exit(1);
