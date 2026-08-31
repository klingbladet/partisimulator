import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { retrieveContext } from "@/lib/rag";
import { buildDirectQuestionPrompt } from "@/lib/prompts";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const partyId = body.partyId;
    const question = body.question || body.prompt;
    const history: Array<{ role: "user" | "assistant"; content: string }> = body.history || [];

    if (!partyId || !question) {
      return new Response(
        JSON.stringify({ error: "partyId och question krävs" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const party = getParty(partyId);
    if (!party) {
      return new Response(
        JSON.stringify({ error: `Okänt parti: ${partyId}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Retrieve relevant manifest context via RAG (with 2.5s safety timeout)
    const context = await retrieveContext(partyId, question);

    // Build the system prompt with party persona + manifest context
    const systemPrompt = buildDirectQuestionPrompt(party, context);

    // Build message list with prior conversation history for continuity
    const messages = [
      ...history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: question },
    ];

    // Stream the response via OpenRouter
    const modelName = process.env.OPENROUTER_MODEL || "openrouter/free";
    const result = streamText({
      model: openrouter(modelName),
      system: systemPrompt,
      messages,
      maxOutputTokens: 1024,
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (err: any) {
    console.error("Error in /api/ask:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Ett oväntat serverfel uppstod" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
