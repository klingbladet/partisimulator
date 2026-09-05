import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { readToolCall } from "./read-tool-call.mjs";

function respond(decision, reason) {
  console.log(JSON.stringify(reason ? { decision, reason } : { decision }));
  process.exit(0);
}

const { name, args, workspaceRoot } = await readToolCall();
const { TargetFile: filePath = "" } = args;

if (!/\.(md|ts|tsx|mjs|css|html|sql|json|jsonc|yaml|yml|txt)$/.test(filePath)) {
  respond("allow");
}

// write_to_file and replace_file_content carry the new text directly in their args.
// multi_replace_file_content's ReplacementChunks shape isn't documented, so it's left unchecked
// rather than guessed at.
const newText =
  name === "write_to_file" ? args.CodeContent : name === "replace_file_content" ? args.ReplacementContent : undefined;

if (newText === undefined) {
  respond("allow");
}

const tempDir = mkdtempSync(join(tmpdir(), "partisimulator-spellcheck-"));
const tempFile = join(tempDir, `check${extname(filePath)}`);
writeFileSync(tempFile, newText, "utf8");

const result = spawnSync("pnpm", ["exec", "cspell", "lint", "--no-progress", tempFile], {
  cwd: workspaceRoot,
  encoding: "utf8",
  shell: true,
});

rmSync(tempDir, { force: true, recursive: true });

// A missing pnpm/cspell is the contributor's setup problem, not this edit's, so stay quiet.
if (result.error) {
  respond("allow");
}

// cspell never rewrites files, so a failure here always needs a human or agent decision:
// fix the typo, or add the word to project-words.txt or swedish-words.txt.
if (result.status !== 0) {
  respond("deny", `Spellcheck found unknown words in this content:\n${result.stdout}${result.stderr}`);
}

respond("allow");
