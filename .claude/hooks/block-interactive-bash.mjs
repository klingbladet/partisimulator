import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

const dangerousPatterns = ["bash -i", "bash -l", "bash --login", "bash --interactive"];

for (const pattern of dangerousPatterns) {
  if (new RegExp(`(^|&&|\\|\\||;)\\s*${pattern}(\\s|$)`).test(command)) {
    block(`BLOCKED: '${command}' matches dangerous pattern '${pattern}'. The user has prevented you from doing this.`);
  }
}
