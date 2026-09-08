const isDebugEnabled = process.env.DEBUG === "true";

/**
 * Logs how long an operation took - every call when DEBUG=true, otherwise only when it crosses
 * slowThresholdMs. Local dev only: this is console output for whoever has `pnpm dev` running in
 * their terminal, not a log shipped anywhere.
 */
export function logDuration(label: string, durationMs: number, slowThresholdMs: number): void {
  if (isDebugEnabled) {
    console.log(`[DEBUG] ${label}: ${Math.round(durationMs)}ms`);
    return;
  }
  if (durationMs > slowThresholdMs) {
    console.warn(`Slow: ${label} took ${Math.round(durationMs)}ms (over ${slowThresholdMs}ms)`);
  }
}

/** Times an async operation and reports it via logDuration, then resolves to the operation's own result. */
export async function withDuration<T>(label: string, slowThresholdMs: number, operation: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  const result = await operation();
  logDuration(label, Date.now() - startedAt, slowThresholdMs);
  return result;
}

/** Logs a one-off diagnostic message, only when DEBUG=true. */
export function logDebug(message: string): void {
  if (isDebugEnabled) {
    console.log(`[DEBUG] ${message}`);
  }
}
