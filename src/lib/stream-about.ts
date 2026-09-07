import type { AboutBeatEvent } from "@/types/stream";

/** Posts to /api/about and invokes onEvent for each SSE "data:" line as it streams in. */
export async function streamAbout(onEvent: (event: AboutBeatEvent) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch("/api/about", { method: "POST", signal });

  if (!res.body) throw new Error("Inget svar från servern");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      try {
        onEvent(JSON.parse(line.slice(6)));
      } catch {
        // ignore parse errors
      }
    }
  }
}
