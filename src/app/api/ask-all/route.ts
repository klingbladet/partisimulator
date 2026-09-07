import { generateText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { getModel } from "@/lib/model";
import { buildNoAnswerFallback } from "@/lib/no-answer";
import { PARTIES } from "@/lib/parties";
import { buildAskAllPrompt, getLongAnswerMaxSentences, getMaxSentences } from "@/lib/prompts";
import { retrieveContext } from "@/lib/rag";
import { sanitizeSpeech } from "@/lib/sanitize";
import { limitToSentences } from "@/lib/sentence-limit";
import { cleanText, extractSources, extractStance, splitShortLong, stripStanceMarker } from "@/lib/sources";
import { askAllRequestSchema } from "@/lib/validation";

export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<Response> {
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
  const { question } = parsed.data;

  // Set up SSE stream
  const encoder = new TextEncoder();
  // A ReadableStream's own start() executor keeps running to completion even after the client
  // disconnects — only its cancel() callback tells us that happened, so a dedicated controller
  // (rather than req.signal, which tracks the already-fully-read request body, not the response
  // being read) is what actually stops the in-flight generateText calls for every party.
  const abortController = new AbortController();
  const stream = new ReadableStream({
    cancel(reason) {
      abortController.abort(reason);
    },
    async start(controller) {
      // Run all 8 parties in parallel
      const promises = PARTIES.map(async (party) => {
        try {
          const context = await retrieveContext(party.id, question);
          const systemPrompt = buildAskAllPrompt(party, context);

          const { text } = await generateText({
            abortSignal: abortController.signal,
            maxOutputTokens: 600,
            messages: [{ content: question, role: "user" }],
            model: getModel(),
            system: systemPrompt,
            temperature: 0.3,
          });

          const cleaned = sanitizeSpeech(text);
          const stance = extractStance(cleaned);
          const { long, short } = splitShortLong(stripStanceMarker(cleaned));

          // Enforce the length caps in code, since not every model follows them from the prompt alone
          const limitedShort = limitToSentences(short, getMaxSentences("ask-all"));
          const limitedLong = long ? limitToSentences(long, getLongAnswerMaxSentences()) : undefined;
          const finalShort = cleanText(limitedShort);

          if (!finalShort) {
            // Sanitizing removed everything (e.g. the whole raw reply was a leaked reasoning
            // preamble) — show the in-character fallback instead of an empty card.
            const fallback = buildNoAnswerFallback(party);
            const fallbackEvent = JSON.stringify({
              manifestUrl: fallback.manifestUrl,
              partyId: party.id,
              text: fallback.text,
              type: "error",
            });
            if (!abortController.signal.aborted) {
              controller.enqueue(encoder.encode(`data: ${fallbackEvent}\n\n`));
            }
            return;
          }

          const sources = [...extractSources(limitedShort), ...(limitedLong ? extractSources(limitedLong) : [])];

          const event = JSON.stringify({
            longAnswer: limitedLong ? cleanText(limitedLong) : undefined,
            partyId: party.id,
            sources,
            stance,
            text: finalShort,
            type: "answer",
          });
          if (!abortController.signal.aborted) {
            controller.enqueue(encoder.encode(`data: ${event}\n\n`));
          }
        } catch (error) {
          if (abortController.signal.aborted) return;
          const fallback = buildNoAnswerFallback(party);
          const errorEvent = JSON.stringify({
            manifestUrl: fallback.manifestUrl,
            partyId: party.id,
            text: fallback.text,
            type: "error",
          });
          controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
          console.error(`Error for party ${party.id}:`, error);
        }
      });

      await Promise.all(promises);

      if (!abortController.signal.aborted) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}
