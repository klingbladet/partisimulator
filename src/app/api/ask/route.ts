import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { getModel } from "@/lib/model";
import { getParty } from "@/lib/parties";
import { buildOneShotPrompt, getMaxSentences } from "@/lib/prompts";
import { retrieveContext } from "@/lib/rag";
import { isWithinRateLimit } from "@/lib/rate-limit";
import { createSentenceLimitTransform } from "@/lib/sentence-limit";
import { askRequestSchema } from "@/lib/validation";

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  if (!isWithinRateLimit(req, "ask", 20, 5 * 60_000)) {
    return errorResponse("För många frågor - vänta en stund och försök igen", 429);
  }

  try {
    const body = await req.json();
    // useCompletion's own default body carries the prompt as `prompt`; the explicit body override
    // in use-chat-conversation.ts sends the same text again as `question`, which takes precedence.
    const parsed = askRequestSchema.safeParse({ ...body, question: body.question || body.prompt });
    if (!parsed.success) {
      return errorResponse("Ogiltig fråga - den får inte vara tom eller längre än 500 tecken", 400);
    }
    const { history = [], partyId, question } = parsed.data;

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
      abortSignal: req.signal,
      experimental_transform: createSentenceLimitTransform(getMaxSentences("one-shot")),
      maxOutputTokens: 400,
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
