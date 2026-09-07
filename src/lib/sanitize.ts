/**
 * Strips a model's chain-of-thought from its reply before it's saved to history or shown in the UI.
 *
 * OpenRouter is asked to exclude reasoning tokens at the source (see src/lib/model.ts), but some
 * providers ignore that, and the local MLX path has no equivalent flag at all — so this is the
 * last line of defense. Reasoning models near-universally wrap their thinking in <think>-style
 * tags, so matching on the tag (not on phrases from any one model's particular wording) is what
 * makes this robust across models instead of reactively patched per incident.
 */
const CLOSED_THINK_BLOCK = /<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi;
// Handles a still-streaming block whose closing tag hasn't arrived yet, so nothing from an
// unfinished thought is ever shown even mid-stream.
const UNCLOSED_THINK_BLOCK = /<(think|thinking|reasoning)>[\s\S]*$/i;

/**
 * Some models never wrap their chain-of-thought in a tag at all — they open the raw reply with
 * their own untagged analysis instead (e.g. "User Safety: safe", "We need to produce Alice's
 * reply, following the rules."). Each pattern is anchored to the very start of the text, so a
 * party's real reply can never match partway through — these are known leak openers, not a
 * blanket ban on the phrase appearing anywhere.
 */
const LEAK_PREAMBLE_PATTERNS = [
  /^Here's a thinking process:[\s\S]*?(?=\n[A-ZÅÄÖ]|\n\n)/im,
  /^User Safety:[\s\S]*?$/im,
  /^We need to produce[^\n]*\n?/im,
];

function stripLeakPreamble(text: string): string {
  return LEAK_PREAMBLE_PATTERNS.reduce((current, pattern) => current.replace(pattern, ""), text);
}

export function sanitizeSpeech(rawText: string): string {
  if (!rawText) return "";

  const withoutClosedBlocks = rawText.replace(CLOSED_THINK_BLOCK, "");
  const withoutOpenBlock = withoutClosedBlocks.replace(UNCLOSED_THINK_BLOCK, "");
  const withoutLeakPreamble = stripLeakPreamble(withoutOpenBlock);

  return withoutLeakPreamble.replace(/\n{3,}/g, "\n\n").trim();
}
