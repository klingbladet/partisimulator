import { runProjectScript } from "../../.claude/hooks/project-script.mjs";
import { readToolCall } from "./read-tool-call.mjs";

const {
  args: { TargetFile: filePath = "" },
  workspaceRoot,
} = await readToolCall();

if (!/\.(ts|tsx|mjs|js|jsx|json|jsonc|css|html)$/.test(filePath)) {
  process.exit(0);
}

// PostToolUse can't gate the agent here, but lint-format-code rewrites the file in place either way.
runProjectScript("lint-format-code", workspaceRoot);
