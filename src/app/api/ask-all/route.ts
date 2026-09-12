import { generateText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { withDuration } from "@/lib/debug-log";
import { getModel } from "@/lib/model";
import { buildNoAnswerFallback } from "@/lib/no-answer";
import { PARTIES } from "@/lib/parties";
import { buildAskAllPrompt, getLongAnswerMaxSentences, getMaxSentences } from "@/lib/prompts";
import { retrieveContext } from "@/lib/rag";
import { isWithinRateLimit } from "@/lib/rate-limit";
import { sanitizeSpeech } from "@/lib/sanitize";
import { extractCompleteText } from "@/lib/sentence-limit";
import { cleanText, extractSources, extractStance, splitShortLong, stripStanceMarker } from "@/lib/sources";
import { createSseResponse } from "@/lib/sse";
import { askAllRequestSchema } from "@/lib/validation";

export const maxDuration = 120;

// Same reasoning as the single-party routes: worth flagging in dev well before the maxDuration
// ceiling above is anywhere near hit.
const LLM_SLOW_THRESHOLD_MS = 8000;

export async function POST(req: NextRequest): Promise<Response> {
  // Lower budget than the other routes: each request fans out to 8 parallel LLM calls, not 1.
  if (!isWithinRateLimit(req, "ask-all", 8, 5 * 60_000)) {
    return errorResponse("För många frågor - vänta en stund och försök igen", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Error in /api/ask-all:", error);
    return errorResponse("Ogiltig request-body", 400);
  }

  const parsed = askAllRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Ogiltig fråga - den får inte vara tom eller längre än 500 tecken", 400);
  }
  const { partyIds, question } = parsed.data;
  const parties = partyIds ? PARTIES.filter((party) => partyIds.includes(party.id)) : PARTIES;

  // A ReadableStream's own start() executor keeps running to completion even after the client
  // disconnects - only its cancel() callback tells us that happened, so the signal createSseResponse
  // hands back (rather than req.signal, which tracks the already-fully-read request body, not the
  // response being read) is what actually stops the in-flight generateText calls for every party.
  return createSseResponse(async (emitter, signal) => {
    // Run every requested party in parallel
    const promises = parties.map(async (party) => {
      try {
        const context = await retrieveContext(party.id, question);
        const grounded = context.length > 0;
        const systemPrompt = buildAskAllPrompt(party, context);

        const { finishReason, text } = await withDuration(
          `LLM generation (ask-all, ${party.id})`,
          LLM_SLOW_THRESHOLD_MS,
          () =>
            generateText({
              abortSignal: signal,
              maxOutputTokens: 600,
              maxRetries: 0,
              messages: [{ content: question, role: "user" }],
              model: getModel(),
              system: systemPrompt,
              temperature: 0.3,
            }),
        );

        const cleaned = sanitizeSpeech(text);
        const stance = extractStance(cleaned);
        const { long, short } = splitShortLong(stripStanceMarker(cleaned));

        // Enforce the length caps in code, since not every model follows them from the prompt
        // alone - and if the model got cut off before finishing even one sentence (a free/lower-
        // tier model burning its budget on reasoning tokens `reasoning.exclude` hides but doesn't
        // refund), treat that half as unusable rather than showing the raw, truncated fragment.
        const limitedShort = extractCompleteText(
          short,
          finishReason,
          getMaxSentences("ask-all"),
          `ask-all, ${party.id}`,
        );
        const limitedLong = long
          ? extractCompleteText(long, finishReason, getLongAnswerMaxSentences(), `ask-all long, ${party.id}`)
          : undefined;
        const finalShort = cleanText(limitedShort);

        if (!finalShort) {
          // Sanitizing removed everything (e.g. the whole raw reply was a leaked reasoning
          // preamble) - show the in-character fallback instead of an empty card.
          console.warn(`Reply discarded (ask-all, ${party.id}): sanitized down to nothing`);
          const fallback = buildNoAnswerFallback(party);
          emitter.send({
            manifestUrl: fallback.manifestUrl,
            partyId: party.id,
            text: fallback.text,
            type: "error",
          });
          return;
        }

        // Trust retrieveContext's own result, not the model's self-reported [KÄLLA: ...] markers -
        // the model can still emit one out of habit even when told there's nothing to cite.
        const sources = grounded
          ? [...extractSources(limitedShort), ...(limitedLong ? extractSources(limitedLong) : [])]
          : [];

        emitter.send({
          longAnswer: limitedLong ? cleanText(limitedLong) : undefined,
          partyId: party.id,
          sources,
          stance,
          text: finalShort,
          type: "answer",
        });
      } catch (error) {
        if (signal.aborted) return;
        const fallback = buildNoAnswerFallback(party);
        emitter.send({
          manifestUrl: fallback.manifestUrl,
          partyId: party.id,
          text: fallback.text,
          type: "error",
        });
        console.error(`Error for party ${party.id}:`, error);
      }
    });

    await Promise.all(promises);
    emitter.close();
  });
}
