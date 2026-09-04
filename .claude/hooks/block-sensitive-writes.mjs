import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

// Paths that must never be modified via Bash redirection/copy, even though
// the Write/Edit tool-level deny rules already block the dedicated tools.
const sensitivePatterns =
  /\.ssh(\/|$|\s)|authorized_keys|\.zshrc|\.zprofile|\.bash_profile|\.bashrc|Library\/LaunchAgents/i;

// Anything that can create/overwrite/append a file from a shell command.
const writers = />>?|\btee\b|\bcp\b|\bmv\b|\binstall\b|\bdd\b|\brsync\b/i;

if (writers.test(command) && sensitivePatterns.test(command)) {
  block(
    `BLOCKED: '${command}' attempts to write to a protected path via Bash. The user has prevented you from doing this.`,
  );
}
