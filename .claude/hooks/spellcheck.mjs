import { block, readToolInput } from "./hook.mjs";
import { runProjectScript } from "./project-script.mjs";

const { file_path: filePath = "" } = await readToolInput();

if (!/\.(md|ts|tsx|mjs|css|html|sql|json|jsonc|yaml|yml|txt)$/.test(filePath)) {
  process.exit(0);
}

const result = runProjectScript("spellcheck");

// A missing pnpm is the contributor's setup problem, not this edit's, so stay quiet.
if (result.error) {
  process.exit(0);
}

// cspell never rewrites files, so a failure here always needs a human decision:
// fix the typo, or add the word to project-words.txt or swedish-words.txt.
if (result.status !== 0) {
  block(`Spellcheck found unknown words:\n${result.stdout}${result.stderr}`);
}
