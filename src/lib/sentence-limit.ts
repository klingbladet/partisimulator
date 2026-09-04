import type { TextStreamPart, ToolSet } from "ai";

const SENTENCE_END_CHARS = new Set([".", "!", "?"]);

/** Index right after the Nth sentence-ending punctuation mark in text, or null if it has fewer sentences. */
function findSentenceBoundary(text: string, sentenceCount: number): number | null {
  let count = 0;
  for (let index = 0; index < text.length; index++) {
    if (SENTENCE_END_CHARS.has(text[index] ?? "")) {
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
 */
export function createSentenceLimitTransform<TOOLS extends ToolSet>(maxSentences: number) {
  return ({
    stopStream,
  }: {
    stopStream: () => void;
  }): TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>> => {
    let sentenceCount = 0;
    let stopped = false;

    return new TransformStream({
      transform(chunk, controller) {
        if (stopped) {
          return;
        }
        if (chunk.type !== "text-delta") {
          controller.enqueue(chunk);
          return;
        }

        const boundary = findSentenceBoundary(chunk.text, maxSentences - sentenceCount);
        if (boundary === null) {
          sentenceCount += [...chunk.text].filter((char) => SENTENCE_END_CHARS.has(char)).length;
          controller.enqueue(chunk);
          return;
        }

        controller.enqueue({ ...chunk, text: chunk.text.slice(0, boundary) });
        stopped = true;
        stopStream();
      },
    });
  };
}
