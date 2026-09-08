export interface SseEmitter {
  send(event: unknown): void;
  close(): void;
}

/**
 * Wraps the ReadableStream/Response boilerplate shared by every route that fans out multiple async
 * events over SSE (about, ask-all), as opposed to piping one model's token stream straight through
 * via the AI SDK's own toTextStreamResponse (ask, debate).
 */
export function createSseResponse(run: (emitter: SseEmitter, signal: AbortSignal) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const abortController = new AbortController();

  const stream = new ReadableStream({
    cancel(reason) {
      abortController.abort(reason);
    },
    async start(controller) {
      let closed = false;
      const emitter: SseEmitter = {
        close() {
          if (closed || abortController.signal.aborted) return;
          closed = true;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        },
        send(event) {
          if (closed || abortController.signal.aborted) return;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        },
      };
      await run(emitter, abortController.signal);
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
