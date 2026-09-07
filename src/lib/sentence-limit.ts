import type { TextStreamPart, ToolSet } from "ai";

/**
 * A "." only ends a sentence when followed by whitespace or the end of the text - otherwise it's
 * mid-abbreviation (e.g. every dot in "A.W.E.S.O.M.-O"), which would otherwise trip the sentence
 * cap after just a few words. "!" and "?" have no such ambiguity, so any occurrence counts.
 */
function isSentenceEnd(text: string, index: number): boolean {
  const char = text[index];
  if (char === "!" || char === "?") {
    return true;
  }
  if (char !== ".") {
    return false;
  }
  const next = text[index + 1];
  return next === undefined || /\s/.test(next);
}

/** Index right after the Nth sentence-ending punctuation mark in text, or null if it has fewer sentences. */
function findSentenceBoundary(text: string, sentenceCount: number): number | null {
  let count = 0;
  for (let index = 0; index < text.length; index++) {
    if (isSentenceEnd(text, index)) {
      count++;
      if (count >= sentenceCount) {
        return index + 1;
      }
    }
  }
  return null;
}

/** Truncates text to at most maxSentences complete sentences, used for non-streaming replies (e.g. /api/ask-all). */
export function limitToSentences(text: string, maxSentences: number): string {
  const boundary = findSentenceBoundary(text, maxSentences);
  return boundary === null ? text : text.slice(0, boundary);
}

/**
 * A streamText `experimental_transform` that stops generation the moment maxSentences complete
 * sentences have streamed, so the length limit holds regardless of whether the configured model
 * (OpenRouter-hosted or local via MLX) actually follows the prompt's own length instruction.
 *
 * Recomputes the boundary against the full text accumulated so far rather than just the latest
 * chunk, holding back a trailing "." until more text resolves whether it's a real sentence end -
 * a chunk boundary can otherwise land right after a mid-abbreviation dot.
 */
export function createSentenceLimitTransform<TOOLS extends ToolSet>(maxSentences: number) {
  return ({
    stopStream,
  }: {
    stopStream: () => void;
  }): TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>> => {
    let accumulatedText = "";
    let emittedLength = 0;
    let stopped = false;
    let lastChunk: Extract<TextStreamPart<TOOLS>, { type: "text-delta" }> | undefined;

    return new TransformStream({
      flush(controller) {
        if (stopped || !lastChunk || emittedLength >= accumulatedText.length) {
          return;
        }
        controller.enqueue({ ...lastChunk, text: accumulatedText.slice(emittedLength) });
      },
      transform(chunk, controller) {
        if (stopped) {
          return;
        }
        if (chunk.type !== "text-delta") {
          controller.enqueue(chunk);
          return;
        }

        lastChunk = chunk;
        accumulatedText += chunk.text;
        const heldBackTrailingDot = accumulatedText.endsWith(".") ? 1 : 0;
        const resolvedLength = accumulatedText.length - heldBackTrailingDot;

        const boundary = findSentenceBoundary(accumulatedText.slice(0, resolvedLength), maxSentences);
        if (boundary !== null) {
          controller.enqueue({ ...chunk, text: accumulatedText.slice(emittedLength, boundary) });
          stopped = true;
          stopStream();
          return;
        }

        if (resolvedLength > emittedLength) {
          controller.enqueue({ ...chunk, text: accumulatedText.slice(emittedLength, resolvedLength) });
          emittedLength = resolvedLength;
        }
      },
    });
  };
}
