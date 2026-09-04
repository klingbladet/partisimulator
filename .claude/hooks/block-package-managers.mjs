// Guard for direct package manager / runner invocations. npm, npq, and yarn are
// blocked in favor of pnpm; npx and pnpx are blocked because running packages
// directly requires explicit user approval. pnpm itself is policed separately
// by block-pnpm-commands.mjs, which allows read-only subcommands.

import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

const tools = ["npm", "npq", "npx", "pnpx", "yarn", "pip", "brew", "bun", "uv", "uvx", "pip3"];

for (const tool of tools) {
  if (new RegExp(`(^|&&|\\|\\||;)\\s*${tool}(\\s|$)`).test(command)) {
    block(
      tool === "npx" || tool === "pnpx"
        ? "BLOCKED: Running packages directly requires explicit user approval"
        : `BLOCKED: Use pnpm, not ${tool}`,
    );
  }
}
