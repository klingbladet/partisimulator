import { runProjectScript } from "../../.claude/hooks/project-script.mjs";
import { readToolCall } from "./read-tool-call.mjs";

const {
  args: { TargetFile: filePath = "" },
  workspaceRoot,
} = await readToolCall();

if (!filePath.endsWith(".md")) {
  process.exit(0);
}

// PostToolUse can't gate the agent here, but lint-format-markdown rewrites the file in place either way.
runProjectScript("lint-format-markdown", workspaceRoot);
