import { block, readToolInput } from "./hook.mjs";
import { runProjectScript } from "./project-script.mjs";

const { file_path: filePath = "" } = await readToolInput();

if (!filePath.endsWith(".md")) {
  process.exit(0);
}

const result = runProjectScript("lint-format-markdown");

// A missing pnpm is the contributor's setup problem, not this edit's, so stay quiet.
if (result.error) {
  process.exit(0);
}

if (result.status !== 0) {
  block(`lint-format-markdown found problems it could not fix:\n${result.stdout}${result.stderr}`);
}
