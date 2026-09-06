import { text } from "node:stream/consumers";

// Antigravity sends the tool call as JSON on stdin, shaped as
// { toolCall: { name, args }, workspacePaths, ... }, for both PreToolUse and PostToolUse.
// workspacePaths is read here because there's no documented cwd for the hook subprocess itself.
export async function readToolCall() {
  const payload = JSON.parse(await text(process.stdin));

  return {
    args: payload.toolCall?.args ?? {},
    name: payload.toolCall?.name ?? "",
    workspaceRoot: payload.workspacePaths?.[0],
  };
}
