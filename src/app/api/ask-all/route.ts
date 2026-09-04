import { generateText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { getModel } from "@/lib/model";
import { PARTIES } from "@/lib/parties";
import { buildAskAllPrompt, getLongAnswerMaxSentences, getMaxSentences } from "@/lib/prompts";
import { retrieveContext } from "@/lib/rag";
import { limitToSentences } from "@/lib/sentence-limit";
import { cleanText, extractSources, extractStance, splitShortLong, stripStanceMarker } from "@/lib/sources";

export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<Response> {
  const { question } = await req.json();

  if (!question) {
    return errorResponse("question krävs", 400);
  }

  // Set up SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Run all 8 parties in parallel
      const promises = PARTIES.map(async (party) => {
        try {
          const context = await retrieveContext(party.id, question);
          const systemPrompt = buildAskAllPrompt(party, context);

          const { text } = await generateText({
            maxOutputTokens: 400,
            messages: [{ content: question, role: "user" }],
            model: getModel(),
            system: systemPrompt,
            temperature: 0.3,
          });

          const stance = extractStance(text);
          const { long, short } = splitShortLong(stripStanceMarker(text));

          // Enforce the length caps in code, since not every model follows them from the prompt alone
          const limitedShort = limitToSentences(short, getMaxSentences("ask-all"));
          const limitedLong = long ? limitToSentences(long, getLongAnswerMaxSentences()) : undefined;

          const sources = [...extractSources(limitedShort), ...(limitedLong ? extractSources(limitedLong) : [])];

          const event = JSON.stringify({
            longAnswer: limitedLong ? cleanText(limitedLong) : undefined,
            partyId: party.id,
            sources,
            stance,
            text: cleanText(limitedShort),
            type: "answer",
          });
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        } catch (error) {
          const errorEvent = JSON.stringify({
            partyId: party.id,
            text: "Kunde inte generera svar för detta parti.",
            type: "error",
          });
          controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
          console.error(`Error for party ${party.id}:`, error);
        }
      });

      await Promise.all(promises);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
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
