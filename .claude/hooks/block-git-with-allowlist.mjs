// Guard for git only. Read-only git commands on the allowlist pass; any other git
// invocation is blocked. Every non-git command is passed straight through to the
// normal permission flow untouched, so build/lint scripts and other tools run as
// usual.

import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

// Only police commands that actually invoke git. Prepending a space lets a leading
// "git" be matched by the same "non-word char before git" boundary as one after a
// separator, so substrings ("digit", "legit") do not trip the guard while a
// real invocation ("git ...", "foo && git ...", "/usr/bin/git ...") does.
if (!/[^a-zA-Z0-9_]git\s/.test(` ${command}`)) {
  process.exit(0);
}

// From here the command references git. Reject shell metacharacters so a read-only
// prefix cannot smuggle a mutating command past the prefix-matched allowlist
// (e.g. "git status && git push").
if (/[;|&`><]/.test(command) || command.includes("\n")) {
  block(`BLOCKED: shell metacharacters in git command '${command}'`);
}

// Explicit allowlist of read-only git commands.
const allowlist = [
  /^git log$/, // Exact: git log (without args)
  /^git log ./, // With at least one arg: git log --oneline, et cetera
  /^git diff/, // No or Any args: git diff main feature, et cetera
  /^git status/, // No or Any args: git status --porcelain
  /^git show/, // Any args: git show HEAD, et cetera
  /^git grep/, // Any args: git grep --ignore-case pattern
  /^git ls-files/, // Any args: git ls-files --cached
  /^git describe/, // Any args
  /^git rev-parse ./, // Requires at least one arg: git rev-parse HEAD
  /^git shortlog/, // Any args
  /^git cat-file ./, // Requires at least one arg: git cat-file -p HEAD
  /^git for-each-ref/, // Any args
  /^git name-rev ./, // Requires at least one arg: git name-rev HEAD
  /^git check-ignore/, // Any args
  /^git branch -a$/, // Exact: git branch -a (list only, no deletion)
  /^git branch --show-current$/, // Exact: git branch --show-current (read-only)
];

if (!allowlist.some((pattern) => pattern.test(command))) {
  block(`BLOCKED: '${command}' is not a read-only git command!`);
}
