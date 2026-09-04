/**
 * True if the most recently added entry already matches the one about to be appended.
 * Guards against duplicate history entries when both a stream's `onFinish` callback
 * and its awaited `complete()` result resolve with the same final text.
 */
export function isDuplicateOfLastEntry<Entry>(history: Entry[], isSameEntry: (lastEntry: Entry) => boolean): boolean {
  const lastEntry = history[history.length - 1];
  return lastEntry !== undefined && isSameEntry(lastEntry);
}
