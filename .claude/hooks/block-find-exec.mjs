import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

// Only police commands that actually invoke find. Prepending a space lets a leading
// "find" be matched by the same "non-word char before find" boundary as one after a
// separator, so substrings ("finder", "refind") do not trip the guard.
if (!/[^a-zA-Z0-9_]find\s/.test(` ${command}`)) {
  process.exit(0);
}

// find itself is safe for searching. These flags let it act on matches instead of
// just reporting them, which is how it bypasses block-rm.mjs/block-chmod.mjs/block-sudo.mjs
// ("find . -delete", "find . -exec rm -rf {} \;" never contain "rm -rf" at a position
// those hooks check).
const dangerousPatterns = ["-delete", "-exec", "-execdir", "-ok", "-okdir"];

for (const pattern of dangerousPatterns) {
  if (new RegExp(`(^|\\s)${pattern}(\\s|$)`).test(command)) {
    block(
      `BLOCKED: '${command}' matches dangerous pattern '${pattern}'. find may only search, not act on results. The user has prevented you from doing this.`,
    );
  }
}
