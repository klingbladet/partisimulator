import { readSseStream } from "@/lib/read-sse-stream";
import type { AboutBeatEvent } from "@/types/stream";

/** Posts to /api/about and invokes onEvent for each SSE "data:" line as it streams in. */
export async function streamAbout(onEvent: (event: AboutBeatEvent) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch("/api/about", { method: "POST", signal });
  await readSseStream(res, onEvent);
}
