import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { getModel } from "@/lib/model";
import { getParty } from "@/lib/parties";
import { buildDebatePrompt } from "@/lib/prompts";
import { retrieveContext } from "@/lib/rag";
import type { DebateEntry } from "@/types/debate";

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  const {
    selectedParties,
    topic,
    history,
    nextSpeakerId,
  }: {
    selectedParties: string[];
    topic: string;
    history: DebateEntry[];
    nextSpeakerId: string;
  } = await req.json();

  if (!topic || !nextSpeakerId || !selectedParties?.length) {
    return errorResponse("topic, nextSpeakerId och selectedParties krävs", 400);
  }

  const party = getParty(nextSpeakerId);
  if (!party) {
    return errorResponse(`Okänt parti: ${nextSpeakerId}`, 404);
  }

  const context = await retrieveContext(nextSpeakerId, topic);

  const conversationHistory = history.map((historyEntry) => ({
    speaker: historyEntry.speakerName,
    text: historyEntry.text,
  }));

  const systemPrompt = buildDebatePrompt(party, topic, context, conversationHistory);

  const lastHistoryEntry = conversationHistory[conversationHistory.length - 1];

  let userMessageContent: string;
  if (lastHistoryEntry?.speaker.includes("Debattledare")) {
    userMessageContent = `Debattledaren har ställt frågan: "${lastHistoryEntry.text}". Ge ${party.displayName}s direkta replik på denna fråga i debatten om "${topic}".`;
  } else {
    userMessageContent = `Det är dags för ${party.displayName} att ta ordet och svara i debatten om "${topic}".`;
  }

  const result = streamText({
    maxOutputTokens: 512,
    messages: [{ content: userMessageContent, role: "user" }],
    model: getModel(),
    system: systemPrompt,
    temperature: 0.4,
  });

  return result.toTextStreamResponse();
}
