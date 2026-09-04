export interface AskAllEvent {
  type: "answer" | "error" | "done";
  partyId?: string;
  text?: string;
  sources?: string[];
}

/** Posts a question to /api/ask-all and invokes onEvent for each SSE "data:" line as it streams in. */
export async function streamAskAll(question: string, onEvent: (event: AskAllEvent) => void): Promise<void> {
  const res = await fetch("/api/ask-all", {
    body: JSON.stringify({ question }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

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
