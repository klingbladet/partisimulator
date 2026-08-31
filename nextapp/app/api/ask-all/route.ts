import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { retrieveContext } from "@/lib/rag";
import { buildDirectQuestionPrompt } from "@/lib/prompts";
import { PARTIES } from "@/lib/parties";
import { NextRequest } from "next/server";

export const maxDuration = 120;

// OpenRouter via @ai-sdk/openai with custom base URL
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://partisimulator.vercel.app",
    "X-Title": "PartiSimulator 2026",
  },
});

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  if (!question) {
    return new Response(
      JSON.stringify({ error: "question krävs" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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

          const modelName = process.env.OPENROUTER_MODEL || "openrouter/free";
          const { text } = await generateText({
            model: openrouter(modelName),
            system: systemPrompt,
            messages: [{ role: "user", content: question }],
            maxOutputTokens: 512,
            temperature: 0.3,
          });

          // Extract source citations from the response
          const sourceMatch = text.match(/\[KÄLLA:[^\]]+\]/g);

          const event = JSON.stringify({
            type: "answer",
            partyId: party.id,
            text: text.replace(/\[KÄLLA:[^\]]+\]/g, "").trim(),
            sources: sourceMatch || [],
          });
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        } catch (err) {
          const error = JSON.stringify({
            type: "error",
            partyId: party.id,
            text: "Kunde inte generera svar för detta parti.",
          });
          controller.enqueue(encoder.encode(`data: ${error}\n\n`));
          console.error(`Error for party ${party.id}:`, err);
        }
      });

      await Promise.all(promises);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
