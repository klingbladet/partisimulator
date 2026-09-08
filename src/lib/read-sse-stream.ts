/** Reads a fetch Response's body as SSE, invoking onEvent for each "data:" line as it streams in. */
export async function readSseStream<TEvent>(res: Response, onEvent: (event: TEvent) => void): Promise<void> {
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
