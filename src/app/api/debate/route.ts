import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { logDuration } from "@/lib/debug-log";
import { createGroundingMarkerTransform } from "@/lib/grounding-transform";
import { getModel } from "@/lib/model";
import { getParty } from "@/lib/parties";
import { buildDebatePrompt, getMaxSentences } from "@/lib/prompts";
import { buildRetrievalQuery, retrieveContext } from "@/lib/rag";
import { isWithinRateLimit } from "@/lib/rate-limit";
import { sanitizeSpeech } from "@/lib/sanitize";
import { createSentenceLimitTransform } from "@/lib/sentence-limit";
import { debateRequestSchema } from "@/lib/validation";

export const maxDuration = 60;

// The maxDuration ceiling above is 60s; a reply that takes meaningfully longer than this is
// worth flagging in dev, since it's still a bad answer time even though it hasn't hit the ceiling.
const LLM_SLOW_THRESHOLD_MS = 8000;

export async function POST(req: NextRequest): Promise<Response> {
  // Higher budget than /api/ask: auto mode legitimately fires a new request every few seconds as
  // it chains through speakers on its own, not just in response to direct user action.
  if (!isWithinRateLimit(req, "debate", 60, 5 * 60_000)) {
    return errorResponse("För många repliker - vänta en stund och försök igen", 429);
  }

  try {
    const body = await req.json();
    const parsed = debateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Ogiltig request - kontrollera ämne, historik och valda partier (max 500 tecken för ämnet)",
        400,
      );
    }
    const { history, isClosingStatement, nextSpeakerId, topic } = parsed.data;

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
    const grounded = context.length > 0;

    const systemPrompt = buildDebatePrompt(party, topic, context, recentHistory, Boolean(isClosingStatement));

    const lastEntry = recentHistory[recentHistory.length - 1];

    let userMessageContent: string;
    if (isClosingStatement) {
      userMessageContent = `Det är dags för ${party.displayName} att ge sin slutplädering i debatten om "${topic}".`;
    } else if (lastEntry?.speaker.includes("Debattledare")) {
      userMessageContent = `Debattledaren har ställt frågan: "${lastEntry.text}". Ge ${party.displayName}s direkta replik.`;
    } else {
      userMessageContent = `Det är dags för ${party.displayName} att ta ordet i debatten om "${topic}".`;
    }

    const generationStartedAt = Date.now();
    const result = streamText({
      abortSignal: req.signal,
      experimental_transform: [
        createSentenceLimitTransform(getMaxSentences("debate"), `debate, ${party.id}`),
        createGroundingMarkerTransform(grounded),
      ],
      maxOutputTokens: 300,
      messages: [{ content: userMessageContent, role: "user" }],
      model: getModel(),
      onFinish: () => {
        logDuration(`LLM generation (debate, ${party.id})`, Date.now() - generationStartedAt, LLM_SLOW_THRESHOLD_MS);
      },
      system: systemPrompt,
      temperature: 0.4,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in /api/debate:", error);
    return errorResponse("Ett oväntat serverfel uppstod", 500);
  }
}
