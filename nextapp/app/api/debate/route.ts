import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { retrieveContext } from "@/lib/rag";
import { buildDebatePrompt } from "@/lib/prompts";
import { getParty } from "@/lib/parties";
import { NextRequest } from "next/server";

export const maxDuration = 60;

// OpenRouter via @ai-sdk/openai with custom base URL
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://partisimulator.vercel.app",
    "X-Title": "PartiSimulator 2026",
  },
});

interface DebateEntry {
  speakerId: string;
  speakerName: string;
  text: string;
}

export async function POST(req: NextRequest) {
  const { selectedParties, topic, history, nextSpeakerId }: {
    selectedParties: string[];
    topic: string;
    history: DebateEntry[];
    nextSpeakerId: string;
  } = await req.json();

  if (!topic || !nextSpeakerId || !selectedParties?.length) {
    return new Response(
      JSON.stringify({ error: "topic, nextSpeakerId och selectedParties krävs" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const party = getParty(nextSpeakerId);
  if (!party) {
    return new Response(
      JSON.stringify({ error: `Okänt parti: ${nextSpeakerId}` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const context = await retrieveContext(nextSpeakerId, topic);

  const conversationHistory = history.map((h) => ({
    speaker: h.speakerName,
    text: h.text,
  }));

  const systemPrompt = buildDebatePrompt(party, topic, context, conversationHistory);

  const lastHistoryEntry = conversationHistory[conversationHistory.length - 1];
  const isRespondingToModerator = lastHistoryEntry?.speaker.includes("Debattledare");
  const userMessageContent = isRespondingToModerator
    ? `Debattledaren har ställt frågan: "${lastHistoryEntry.text}". Ge ${party.displayName}s direkta replik på denna fråga i debatten om "${topic}".`
    : `Det är dags för ${party.displayName} att ta ordet och svara i debatten om "${topic}".`;

  const modelName = process.env.OPENROUTER_MODEL || "openrouter/free";
  const result = streamText({
    model: openrouter(modelName),
    system: systemPrompt,
    messages: [{ role: "user", content: userMessageContent }],
    maxOutputTokens: 512,
    temperature: 0.4,
  });

  return result.toTextStreamResponse();
}
