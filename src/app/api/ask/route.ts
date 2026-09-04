import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { getModel } from "@/lib/model";
import { getParty } from "@/lib/parties";
import { buildOneShotPrompt, getMaxSentences } from "@/lib/prompts";
import { retrieveContext } from "@/lib/rag";
import { createSentenceLimitTransform } from "@/lib/sentence-limit";

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const partyId = body.partyId;
    const question = body.question || body.prompt;
    const history: Array<{ role: "user" | "assistant"; content: string }> = body.history || [];

    if (!partyId || !question) {
      return errorResponse("partyId och question krävs", 400);
    }

    const party = getParty(partyId);
    if (!party) {
      return errorResponse(`Okänt parti: ${partyId}`, 404);
    }

    // Retrieve relevant manifest context via RAG (with 2.5s safety timeout)
    const context = await retrieveContext(partyId, question);

    // Build the system prompt with party persona + manifest context
    const systemPrompt = buildOneShotPrompt(party, context);

    // Build message list with prior conversation history for continuity
    const messages = [
      ...history.map((message) => ({
        content: message.content,
        role: message.role,
      })),
      { content: question, role: "user" as const },
    ];

    // Stream the response via OpenRouter. maxOutputTokens is a generous safety net; the
    // sentence-limit transform is what actually enforces the length regardless of the model.
    const result = streamText({
      experimental_transform: createSentenceLimitTransform(getMaxSentences("one-shot")),
      maxOutputTokens: 200,
      messages,
      model: getModel(),
      system: systemPrompt,
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in /api/ask:", error);

    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = "Ett oväntat serverfel uppstod";
    }

    return errorResponse(message, 500);
  }
}
