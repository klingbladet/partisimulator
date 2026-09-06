import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { getModel } from "@/lib/model";
import { getParty } from "@/lib/parties";
import { buildDebatePrompt, getMaxSentences } from "@/lib/prompts";
import { buildRetrievalQuery, retrieveContext } from "@/lib/rag";
import { createSentenceLimitTransform } from "@/lib/sentence-limit";
import type { DebateEntry } from "@/types/debate";

export const maxDuration = 60;

/**
 * Strippa all engelsk thinking-metadata, instruktionsblock och debug-rader
 * från AI-svar innan de sparas i historik eller skickas till frontend.
 */
function sanitizeSpeech(rawText: string): string {
  if (!rawText) return "";

  let clean = rawText.replace(
    /Here's a thinking process:[\s\S]*?(?=\n[A-ZÅÄÖ]|\n\n|$)/gi,
    "",
  );
  clean = clean.replace(
    /Analyze User Input:[\s\S]*?(?=\n[A-ZÅÄÖ]|\n\n|$)/gi,
    "",
  );
  clean = clean.replace(/User Safety:[\s\S]*?$/gi, "");
  clean = clean.replace(/We need to produce[\s\S]*?\n/gi, "");
  clean = clean.replace(/^\d+\.\s+.*$/gm, "");
  clean = clean.replace(/^[a-zA-Z\s.,:'"()-]{15,}\n/gm, "");
  clean = clean.replace(/\n{3,}/g, "\n\n").trim();

  return clean;
}

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
    maxOutputTokens: 150,
    messages: [{ content: userMessageContent, role: "user" }],
    model: getModel(),
    system: systemPrompt,
    temperature: 0.4,
  });

  return result.toTextStreamResponse();
}
