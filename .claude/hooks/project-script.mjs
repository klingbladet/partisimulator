import { spawnSync } from "node:child_process";

// pnpm resolves to a .cmd shim on Windows, which spawn cannot execute without a shell.
export function runProjectScript(scriptName) {
  return spawnSync("pnpm", ["run", "--silent", scriptName], {
    cwd: process.env.CLAUDE_PROJECT_DIR,
    encoding: "utf8",
    shell: true,
  });
}
