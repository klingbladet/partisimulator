import { createSentenceLimitTransform } from "../src/lib/sentence-limit";

interface TextDeltaChunk {
  type: "text-delta";
  id: string;
  text: string;
}

async function runStream(chunks: string[], maxSentences: number): Promise<string> {
  const transform = createSentenceLimitTransform<Record<string, never>>(maxSentences);
  let stopped = false;
  const stream = transform({ stopStream: () => (stopped = true) });
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const collected: string[] = [];
  const readLoop = (async () => {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value.type === "text-delta") collected.push((value as TextDeltaChunk).text);
    }
  })();

  for (const chunkText of chunks) {
    if (stopped) break;
    await writer.write({ id: "1", text: chunkText, type: "text-delta" } as TextDeltaChunk);
  }
  await writer.close();
  await readLoop;

  return collected.join("");
}

interface Case {
  name: string;
  chunks: string[];
  maxSentences: number;
  expected: string;
}

const cases: Case[] = [
  {
    chunks: ["Vi vill satsa på skolan, t", ".", "ex", ". genom fler lärare. Det är vår plan."],
    expected: "Vi vill satsa på skolan, t.ex. genom fler lärare.",
    maxSentences: 1,
    name: "abbreviation split exactly at its own dot across two chunks",
  },
  {
    chunks: ["Vi vill satsa på ", "bl.a. skolan och vård. Det är vår plan."],
    expected: "Vi vill satsa på bl.a. skolan och vård.",
    maxSentences: 1,
    name: "abbreviation arriving as a single whole chunk",
  },
  {
    chunks: ["Vi vill satsa på skolan, t.ex. genom fler lärare"],
    expected: "Vi vill satsa på skolan, t.ex. genom fler lärare",
    maxSentences: 1,
    name: "stream ends right after an abbreviation, no more sentences follow",
  },
  {
    chunks: ["Vi vill ", "satsa på skolan, t.ex", ". genom fler lärare. Vård är också ", "viktigt. Sist skatten."],
    expected: "Vi vill satsa på skolan, t.ex. genom fler lärare. Vård är också viktigt.",
    maxSentences: 2,
    name: "two sentence cap across chunked abbreviation text",
  },
];

let failures = 0;

for (const testCase of cases) {
  const actual = await runStream(testCase.chunks, testCase.maxSentences);
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
