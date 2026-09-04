import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

if (/(^|&&|\|\||;)\s*sudo(\s|$)/.test(command)) {
  block(`BLOCKED: '${command}' matches dangerous pattern 'sudo'. The user has prevented you from doing this.`);
}
