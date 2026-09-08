import { readSseStream } from "@/lib/read-sse-stream";
import type { AskAllEvent } from "@/types/stream";

/**
 * Posts a question to /api/ask-all and invokes onEvent for each SSE "data:" line as it streams in.
 * Pass `partyIds` to regenerate only those parties' answers instead of fanning out to all of them.
 */
export async function streamAskAll(
  question: string,
  onEvent: (event: AskAllEvent) => void,
  signal?: AbortSignal,
  partyIds?: string[],
): Promise<void> {
  const res = await fetch("/api/ask-all", {
    body: JSON.stringify(partyIds ? { partyIds, question } : { question }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal,
  });
  await readSseStream(res, onEvent);
}
