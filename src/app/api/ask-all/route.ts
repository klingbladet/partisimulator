import { generateText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { getModel } from "@/lib/model";
import { PARTIES } from "@/lib/parties";
import { buildDirectQuestionPrompt } from "@/lib/prompts";
import { retrieveContext } from "@/lib/rag";

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
          const systemPrompt = buildDirectQuestionPrompt(party, context);

          const { text } = await generateText({
            maxOutputTokens: 512,
            messages: [{ content: question, role: "user" }],
            model: getModel(),
            system: systemPrompt,
            temperature: 0.3,
          });

          // Extract source citations from the response
          const sourceMatch = text.match(/\[KÄLLA:[^\]]+\]/g);

          const event = JSON.stringify({
            partyId: party.id,
            sources: sourceMatch || [],
            text: text.replace(/\[KÄLLA:[^\]]+\]/g, "").trim(),
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
