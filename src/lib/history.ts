/**
 * True if the most recently added entry already matches the one about to be appended.
 * Guards against duplicate history entries when both a stream's `onFinish` callback
 * and its awaited `complete()` result resolve with the same final text.
 */
export function isDuplicateOfLastEntry<Entry>(history: Entry[], isSameEntry: (lastEntry: Entry) => boolean): boolean {
  const lastEntry = history[history.length - 1];
  return lastEntry !== undefined && isSameEntry(lastEntry);
}

interface RoleTextEntry {
  role: "assistant" | "user";
  text: string;
}

/** The nearest user entry before `beforeIndex`, with its own index - or undefined if there is none. */
export function findPrecedingUserEntry<Entry extends RoleTextEntry>(
  history: Entry[],
  beforeIndex: number,
): { index: number; text: string } | undefined {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (entry?.role === "user") {
      return { index, text: entry.text };
    }
  }
  return undefined;
}
