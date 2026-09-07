/**
 * The one factual thing the "about us" story is built around - real first names, nothing else.
 * Read from MAKER_NAMES (comma-separated) instead of committed to source, so they never end up
 * in git history. Server-only (this file is never imported by client code) - safe as a plain env
 * var, no NEXT_PUBLIC_ prefix needed. Missing/unset just means an empty cast list, not a crash.
 */
export const MAKER_NAMES: string[] = (process.env.MAKER_NAMES ?? "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);
