import { type RefObject, useRef, useState } from "react";
import { buildNoAnswerFallback } from "@/lib/no-answer";
import { PARTIES } from "@/lib/parties";
import { sanitizeSpeech } from "@/lib/sanitize";
import { cleanText, extractSources } from "@/lib/sources";
import type { DebateEntry } from "@/types/debate";
import type { PartyPersona } from "@/types/party";

interface UseDebateTranscriptResult {
  history: DebateEntry[];
  historyRef: RefObject<DebateEntry[]>;
  currentSpeakerId: string | null;
  currentSpeakerRef: RefObject<string | null>;
  streamingEntryId: string | null;
  streamingEntryIdRef: RefObject<string | null>;
  pendingText: string;
  lastSpeakerIdRef: RefObject<string | null>;
  stoppedRef: RefObject<boolean>;
  regeneratingEntryIdRef: RefObject<string | null>;
  setHistory: (next: DebateEntry[]) => void;
  setCurrentSpeaker: (speakerId: string | null) => void;
  setStreamingEntry: (entryId: string | null) => void;
  setPendingText: (text: string) => void;
  clearCurrentSpeakerDisplay: () => void;
  clearStreamingState: () => void;
  resolveStreamingEntry: (speakerId: string, rawText: string) => void;
  settleTurn: (party: PartyPersona, placeholderId: string, finalResult: string | null | undefined) => void;
  resetTranscript: () => void;
}

/** Owns the debate transcript: history, the in-flight turn's streaming state, and how a turn resolves. */
export function useDebateTranscript(): UseDebateTranscriptResult {
  const [history, setHistoryState] = useState<DebateEntry[]>([]);
  const historyRef = useRef<DebateEntry[]>([]);
  const [currentSpeakerId, setCurrentSpeakerIdState] = useState<string | null>(null);
  const currentSpeakerRef = useRef<string | null>(null);
  // Id of the history entry currently being filled in by a stream, so it can be rendered in place
  // (with pendingText as its live content) instead of as a separate element outside the list.
  const [streamingEntryId, setStreamingEntryIdState] = useState<string | null>(null);
  const streamingEntryIdRef = useRef<string | null>(null);
  const [pendingText, setPendingText] = useState("");
  // Tracks who spoke last regardless of currentSpeakerId (which resets to null between turns), so a
  // freshly-shuffled queue can avoid opening with whoever just closed the previous round.
  const lastSpeakerIdRef = useRef<string | null>(null);
  // Set right before a manual stop. handleStop resolves (or drops) the streaming placeholder
  // itself, synchronously, before the aborted complete() call below settles - so once it does
  // settle, stoppedRef tells settleTurn's cleanup to leave that entry alone rather than
  // re-touching (or deleting) whatever handleStop already put there.
  const stoppedRef = useRef(false);
  // Id of the entry currently being regenerated, if the in-flight request is a retry of an
  // existing (previously failed) entry rather than a brand-new turn's placeholder - so a manual
  // stop with nothing usable back leaves that entry's prior text in place instead of deleting it,
  // since (unlike a fresh placeholder) it already held a real turn's slot in the transcript.
  const regeneratingEntryIdRef = useRef<string | null>(null);

  const setHistory = (next: DebateEntry[]): void => {
    historyRef.current = next;
    setHistoryState(next);
  };

  const setCurrentSpeaker = (speakerId: string | null): void => {
    currentSpeakerRef.current = speakerId;
    setCurrentSpeakerIdState(speakerId);
  };

  // Clears only the *displayed* current speaker, leaving currentSpeakerRef untouched - matches
  // debate-end/reset, where nothing reads that ref again while idle.
  const clearCurrentSpeakerDisplay = (): void => {
    setCurrentSpeakerIdState(null);
  };

  const setStreamingEntry = (entryId: string | null): void => {
    streamingEntryIdRef.current = entryId;
    setStreamingEntryIdState(entryId);
  };

  // Clears everything that marks a turn as "in flight" once it's resolved one way or another.
  const clearStreamingState = (): void => {
    setPendingText("");
    setCurrentSpeaker(null);
    setStreamingEntry(null);
  };

  // Fills in the streaming placeholder entry (added when this turn started, see generateSpeech in
  // use-debate.ts) with its final text, keyed by id so it updates in place instead of appending a
  // new entry. That keeps it in its original chronological slot even if a user interjection was
  // appended to history while this reply was still streaming - appending fresh would silently
  // reorder it after that interjection. Guards on streamingEntryIdRef so a duplicate call (onFinish
  // firing after the awaited complete() already resolved, or vice versa) is a harmless no-op the
  // second time.
  const resolveStreamingEntry = (speakerId: string, rawText: string): void => {
    const party = PARTIES.find((candidateParty) => candidateParty.id === speakerId);
    const entryId = streamingEntryIdRef.current;
    if (!party || !entryId) return;

    lastSpeakerIdRef.current = speakerId;

    const cleaned = cleanText(rawText);
    if (!cleaned) {
      if (stoppedRef.current) {
        if (regeneratingEntryIdRef.current === entryId) {
          // Regenerating an existing entry - leave its prior (fallback) text in place instead of
          // deleting the turn it belongs to.
          clearStreamingState();
          return;
        }
        // User cut the turn off manually before anything usable arrived - drop the placeholder
        // rather than leave a permanent blank bubble, same as the "nothing came back" branches.
        const withoutPlaceholder = historyRef.current.filter((entry) => entry.id !== entryId);
        setHistory(withoutPlaceholder);
        clearStreamingState();
        return;
      }
      // Sanitizing removed everything (e.g. the whole raw reply was a leaked reasoning preamble) -
      // show the in-character fallback instead of leaving a permanent blank bubble.
      const fallback = buildNoAnswerFallback(party);
      const fallbackHistory = historyRef.current.map((entry) =>
        entry.id === entryId
          ? { ...entry, isError: true, manifestUrl: fallback.manifestUrl, text: fallback.text }
          : entry,
      );
      setHistory(fallbackHistory);
      clearStreamingState();
      return;
    }

    const resolvedHistory = historyRef.current.map((entry) =>
      entry.id === entryId ? { ...entry, isError: false, sources: extractSources(rawText), text: cleaned } : entry,
    );
    setHistory(resolvedHistory);
    clearStreamingState();
  };

  // After the API call settles, updates history with the final reply - or, if nothing usable came
  // back and the user didn't stop it manually, the in-character fallback. If the user did stop it,
  // handleStop already resolved (or dropped) this entry synchronously, before this aborted
  // complete() call settled, so there's nothing left to do here.
  const settleTurn = (party: PartyPersona, placeholderId: string, finalResult: string | null | undefined): void => {
    if (finalResult) {
      resolveStreamingEntry(party.id, sanitizeSpeech(finalResult));
      return;
    }
    if (stoppedRef.current) return;
    // Nothing came back (e.g. network error) - show the in-character fallback instead of leaving a
    // permanent blank bubble in the transcript.
    const fallback = buildNoAnswerFallback(party);
    const fallbackHistory = historyRef.current.map((entry) =>
      entry.id === placeholderId
        ? { ...entry, isError: true, manifestUrl: fallback.manifestUrl, text: fallback.text }
        : entry,
    );
    setHistory(fallbackHistory);
    clearStreamingState();
  };

  const resetTranscript = (): void => {
    setHistory([]);
    clearCurrentSpeakerDisplay();
    setPendingText("");
    setStreamingEntry(null);
    lastSpeakerIdRef.current = null;
  };

  return {
    clearCurrentSpeakerDisplay,
    clearStreamingState,
    currentSpeakerId,
    currentSpeakerRef,
    history,
    historyRef,
    lastSpeakerIdRef,
    pendingText,
    regeneratingEntryIdRef,
    resetTranscript,
    resolveStreamingEntry,
    setCurrentSpeaker,
    setHistory,
    setPendingText,
    setStreamingEntry,
    settleTurn,
    stoppedRef,
    streamingEntryId,
    streamingEntryIdRef,
  };
}
