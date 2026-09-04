import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

const managingSubcommands =
  /(^|&&|\|\||;)\s*pnpm\s+(add|dedupe|dlx|i|import|install|install-test|itfetch|link|ln|prune|rb|rebuild|remove|rm|uninstall|unlink|up|update)(\s|$)/;

if (managingSubcommands.test(command)) {
  block("BLOCKED: Managing packages with pnpm requires explicit user approval");
}
