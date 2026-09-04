import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

for (const pattern of ["rm -rf", "rm -fr", "rm -r"]) {
  if (new RegExp(`(^|&&|\\|\\||;)\\s*${pattern}(\\s|$)`).test(command)) {
    block(`BLOCKED: '${command}' matches dangerous pattern '${pattern}'. The user has prevented you from doing this.`);
  }
}
