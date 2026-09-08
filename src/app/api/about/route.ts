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
import { findSentenceBoundary, limitToSentences } from "@/lib/sentence-limit";
import { shuffleArray } from "@/lib/shuffle";
import { sleep } from "@/lib/sleep";
import { createSseResponse, type SseEmitter } from "@/lib/sse";

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
 * Each beat/cast entry gets a small, fixed token budget (below) - plenty for the "max two
 * sentences" the prompt asks for, unless the model burns part of it on reasoning tokens that
 * `reasoning.exclude` strips from the response but not from the budget. A free or lower-tier model
 * doing that runs out before finishing a single sentence, and `limitToSentences` has no boundary to
 * cut at, so it would otherwise return the raw, cut-off fragment verbatim. `finishReason === "length"`
 * combined with no complete sentence anywhere in the text means it's not a real (if short) reply -
 * treated the same as an empty one instead of shown as broken, half-finished text.
 */
function extractCompleteReply(rawText: string, finishReason: string, maxSentences: number): string {
  const sanitized = sanitizeSpeech(rawText);
  if (finishReason === "length" && findSentenceBoundary(sanitized, 1) === null) {
    return "";
  }
  return stripLeakedFormatting(limitToSentences(sanitized, maxSentences));
}

/**
 * One cheap, non-retrying call used to fail fast when the model is unreachable (missing/invalid
 * API key, provider outage, local MLX server not running). Without this check, that same failure
 * would only surface after all ~19 cast + beat calls below each exhaust the SDK's default retries
 * - fine for the 8 cast entries since they run in small parallel batches, but the 11 beats run one
 * after another, multiplying that wasted wait into a long spinner with nothing to show for it.
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

// Free/lower-tier models often enforce a much tighter concurrency limit than a full 8-way fan-out
// - hitting it silently drops every simultaneous call (no retries, see maxRetries: 0 below), which
// can empty the whole cast list even though the same model handles one request at a time fine.
// Small batches keep most of the parallelism's speed while staying under that ceiling.
const CAST_BATCH_SIZE = 3;

async function generateCastEntry(name: string, signal: AbortSignal, emitter: SseEmitter): Promise<void> {
  try {
    const { finishReason, text } = await generateText({
      abortSignal: signal,
      maxOutputTokens: 100,
      maxRetries: 0,
      model: getModel(),
      prompt: "Ge mig texten.",
      system: buildCastEntryPrompt(name),
      temperature: 0.8,
    });

    const bio = extractCompleteReply(text, finishReason, 2);
    if (!bio || signal.aborted) return;

    emitter.send({ name, text: bio, type: "cast" });
  } catch (error) {
    if (signal.aborted) return;
    console.error(`Error generating cast entry for ${name}:`, error);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  // Lower budget than /api/ask: each request runs one call per story beat, not one call total.
  if (!isWithinRateLimit(req, "about", 8, 5 * 60_000)) {
    return errorResponse("För många försök - vänta en stund och försök igen", 429);
  }

  // Beats run sequentially, not in parallel (unlike /api/ask-all's 8 parties) - each one gets the
  // previously generated beats as context so the story reads as one continuous thread, so there's
  // a real dependency between calls, not just a fan-out.
  return createSseResponse(async (emitter, signal) => {
    const reachabilityCheckStartedAt = Date.now();
    if (!(await isModelReachable(signal))) {
      const elapsedMs = Date.now() - reachabilityCheckStartedAt;
      if (elapsedMs < MIN_UNREACHABLE_DELAY_MS && !signal.aborted) {
        await sleep(MIN_UNREACHABLE_DELAY_MS - elapsedMs);
      }
      emitter.send({ type: "castDone" });
      emitter.close();
      return;
    }

    // Cast entries are independent of each other (unlike the beats below), so they run in small
    // parallel batches and stream in whatever order they finish within each batch - see
    // CAST_BATCH_SIZE for why it's batches rather than one full 8-way fan-out.
    const castNames = shuffleArray(MAKER_NAMES);
    for (let batchStart = 0; batchStart < castNames.length; batchStart += CAST_BATCH_SIZE) {
      if (signal.aborted) break;
      const batch = castNames.slice(batchStart, batchStart + CAST_BATCH_SIZE);
      await Promise.all(batch.map((name) => generateCastEntry(name, signal, emitter)));
    }
    // Lets the page know the cast list is done and switch its loading indicator over to the
    // story card - there's otherwise no signal that phase changed, since a slow cast entry can
    // leave the client waiting with no events at all right up until the first beat arrives.
    emitter.send({ type: "castDone" });

    const beatTexts: string[] = [];

    for (let index = 0; index < ABOUT_STORY_BEAT_COUNT; index++) {
      if (signal.aborted) break;

      try {
        const { finishReason, text } = await generateText({
          abortSignal: signal,
          // Small, tight budget per beat - the hard guarantee that every heading gets content
          // instead of one rambling beat eating the whole story's token budget.
          maxOutputTokens: 100,
          maxRetries: 0,
          model: getModel(),
          prompt: "Fortsätt historien.",
          system: buildAboutBeatPrompt(index, beatTexts),
          temperature: 0.7,
        });

        const cleaned = extractCompleteReply(text, finishReason, 2);
        if (!cleaned) continue;

        beatTexts.push(cleaned);
        emitter.send({
          heading: ABOUT_STORY_HEADINGS[index],
          index,
          text: cleaned,
          type: "beat",
        });
      } catch (error) {
        if (signal.aborted) return;
        console.error(`Error generating about beat ${index}:`, error);
      }
    }

    emitter.close();
  });
}
