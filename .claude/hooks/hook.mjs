import { text } from "node:stream/consumers";

// Claude Code sends the tool call as JSON on stdin. Each hook reads one field from it.
export async function readToolInput() {
  return JSON.parse(await text(process.stdin)).tool_input ?? {};
}

// Exit code 2 is the only code Claude Code reads as "block this tool call".
// Anything else, including 1, lets the call through.
export function block(message) {
  console.error(message);
  process.exit(2);
}
