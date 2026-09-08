import { generateText } from "ai";
import type { NextRequest } from "next/server";
import {
  ABOUT_STORY_BEAT_COUNT,
  ABOUT_STORY_HEADINGS,
  buildAboutBeatPrompt,
  buildCastEntryPrompt,
} from "@/lib/about-prompt";
import { errorResponse } from "@/lib/api-response";
import { MAKER_NAMES } from "@/lib/makers";
import { getModel } from "@/lib/model";
import { isWithinRateLimit } from "@/lib/rate-limit";
import { sanitizeSpeech } from "@/lib/sanitize";
import { limitToSentences } from "@/lib/sentence-limit";
import { shuffleArray } from "@/lib/shuffle";
import { sleep } from "@/lib/sleep";

export const maxDuration = 120;

// A weak model can prepend a meta explanation ("Här är texten för Namn:") instead of just
// writing the requested text, despite being told not to - same "never trust the model's
// formatting" reasoning as sanitizeSpeech's leak-preamble patterns.
const PREAMBLE_PATTERN = /^(här är|detta är)[^:]{0,60}:\s*/i;

function stripLeakedFormatting(text: string): string {
  return text
    .replace(PREAMBLE_PATTERN, "")
    .replace(/\*\*/g, "")
    .replace(/^["“”']+|["“”']+$/g, "")
    .trim();
}

/**
 * One cheap, non-retrying call used to fail fast when the model is unreachable (missing/invalid
 * API key, provider outage, local MLX server not running). Without this check, that same failure
 * would only surface after all ~19 cast + beat calls below each exhaust the SDK's default retries
 * - fine for the 8 cast entries since they run in parallel, but the 11 beats run one after another,
 * multiplying that wasted wait into a long spinner with nothing to show for it.
 */
async function isModelReachable(signal: AbortSignal): Promise<boolean> {
  try {
    await generateText({ abortSignal: signal, maxOutputTokens: 5, maxRetries: 0, model: getModel(), prompt: "Hej" });
    return true;
  } catch {
    return false;
  }
}

// A misconfigured model (e.g. a missing env var) fails the reachability check near-instantly,
// which reads as a glitch - the loading dots flash on then immediately off. Padding the
// unreachable path out to at least this long makes it look like an attempt was actually made.
const MIN_UNREACHABLE_DELAY_MS = 1000;

export async function POST(req: NextRequest): Promise<Response> {
  // Lower budget than /api/ask: each request runs one call per story beat, not one call total.
  if (!isWithinRateLimit(req, "about", 8, 5 * 60_000)) {
    return errorResponse("För många försök - vänta en stund och försök igen", 429);
  }

  const encoder = new TextEncoder();
  // Beats run sequentially, not in parallel (unlike /api/ask-all's 8 parties) - each one gets the
  // previously generated beats as context so the story reads as one continuous thread, so there's
  // a real dependency between calls, not just a fan-out.
  const abortController = new AbortController();
  const stream = new ReadableStream({
    cancel(reason) {
      abortController.abort(reason);
    },
    async start(controller) {
      const reachabilityCheckStartedAt = Date.now();
      if (!(await isModelReachable(abortController.signal))) {
        const elapsedMs = Date.now() - reachabilityCheckStartedAt;
        if (elapsedMs < MIN_UNREACHABLE_DELAY_MS && !abortController.signal.aborted) {
          await sleep(MIN_UNREACHABLE_DELAY_MS - elapsedMs);
        }
        if (!abortController.signal.aborted) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "castDone" })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        }
        return;
      }

      // Cast entries are independent of each other (unlike the beats below), so they run in
      // parallel and stream in whatever order they finish - same fan-out shape as /api/ask-all.
      const castPromises = shuffleArray(MAKER_NAMES).map(async (name) => {
        try {
          const { text } = await generateText({
            abortSignal: abortController.signal,
            maxOutputTokens: 100,
            maxRetries: 0,
            model: getModel(),
            prompt: "Ge mig texten.",
            system: buildCastEntryPrompt(name),
            temperature: 0.8,
          });

          const bio = stripLeakedFormatting(limitToSentences(sanitizeSpeech(text), 2));
          if (!bio || abortController.signal.aborted) return;

          const event = JSON.stringify({ name, text: bio, type: "cast" });
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        } catch (error) {
          if (abortController.signal.aborted) return;
          console.error(`Error generating cast entry for ${name}:`, error);
        }
      });
      await Promise.all(castPromises);
      // Lets the page know the cast list is done and switch its loading indicator over to the
      // story card - there's otherwise no signal that phase changed, since a slow cast entry can
      // leave the client waiting with no events at all right up until the first beat arrives.
      if (!abortController.signal.aborted) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "castDone" })}\n\n`));
      }

      const beatTexts: string[] = [];

      for (let index = 0; index < ABOUT_STORY_BEAT_COUNT; index++) {
        if (abortController.signal.aborted) break;

        try {
          const { text } = await generateText({
            abortSignal: abortController.signal,
            // Small, tight budget per beat - the hard guarantee that every heading gets content
            // instead of one rambling beat eating the whole story's token budget.
            maxOutputTokens: 100,
            maxRetries: 0,
            model: getModel(),
            prompt: "Fortsätt historien.",
            system: buildAboutBeatPrompt(index, beatTexts),
            temperature: 0.7,
          });

          const cleaned = stripLeakedFormatting(limitToSentences(sanitizeSpeech(text), 2));
          if (!cleaned) continue;

          beatTexts.push(cleaned);
          if (!abortController.signal.aborted) {
            const event = JSON.stringify({
              heading: ABOUT_STORY_HEADINGS[index],
              index,
              text: cleaned,
              type: "beat",
            });
            controller.enqueue(encoder.encode(`data: ${event}\n\n`));
          }
        } catch (error) {
          if (abortController.signal.aborted) return;
          console.error(`Error generating about beat ${index}:`, error);
        }
      }

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
