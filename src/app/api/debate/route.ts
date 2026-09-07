import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { getModel } from "@/lib/model";
import { getParty } from "@/lib/parties";
import { buildDebatePrompt, getMaxSentences } from "@/lib/prompts";
import { buildRetrievalQuery, retrieveContext } from "@/lib/rag";
import { sanitizeSpeech } from "@/lib/sanitize";
import { createSentenceLimitTransform } from "@/lib/sentence-limit";
import type { DebateEntry } from "@/types/debate";

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  try {
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

    const conversationHistory = history.map((entry) => ({
      speaker: entry.speakerName,
      text: sanitizeSpeech(entry.text),
    }));

    const recentHistory = conversationHistory.slice(-2);

    const retrievalQuery = buildRetrievalQuery(topic, recentHistory);
    const context = await retrieveContext(nextSpeakerId, retrievalQuery);

    const systemPrompt = buildDebatePrompt(party, topic, context, recentHistory);

    const lastEntry = recentHistory[recentHistory.length - 1];

    let userMessageContent: string;
    if (lastEntry?.speaker.includes("Debattledare")) {
      userMessageContent = `Debattledaren har ställt frågan: "${lastEntry.text}". Ge ${party.displayName}s direkta replik.`;
    } else {
      userMessageContent = `Det är dags för ${party.displayName} att ta ordet i debatten om "${topic}".`;
    }

    const result = streamText({
      abortSignal: req.signal,
      experimental_transform: createSentenceLimitTransform(getMaxSentences("debate")),
      maxOutputTokens: 300,
      messages: [{ content: userMessageContent, role: "user" }],
      model: getModel(),
      system: systemPrompt,
      temperature: 0.4,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in /api/debate:", error);

    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = "Ett oväntat serverfel uppstod";
    }

    return errorResponse(message, 500);
  }
}
