import { useCompletion } from "@ai-sdk/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { PARTIES } from "@/lib/parties";
import { cleanText, extractSources } from "@/lib/sources";
import { sanitizeSpeech } from "@/lib/sanitize";
import type { DebateEntry } from "@/types/debate";
import type { PartyId, PartyPersona } from "@/types/party";

const MODERATOR_NAME = "Du (Debattledare)";
const MAX_DEBATE_TURNS = 8;

/** Fisher-Yates shuffle, used to randomize speaking order each auto-mode round. */
function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let currentIndex = shuffled.length - 1; currentIndex > 0; currentIndex--) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    const temp = shuffled[currentIndex];
    shuffled[currentIndex] = shuffled[randomIndex] as T;
    shuffled[randomIndex] = temp as T;
  }
  return shuffled;
}

interface UseDebateResult {
  autoMode: boolean;
  currentSpeakerId: string | null;
  currentSpeakerParty: PartyPersona | null | undefined;
  debateFinished: boolean;
  debateStarted: boolean;
  endDebate: () => void;
  handleSelectSpeaker: (partyId: string) => Promise<void>;
  handleNextSpeaker: () => void;
  handleStop: () => void;
  handleUserInterjection: () => void;
  history: DebateEntry[];
  isLoading: boolean;
  pendingText: string;
  resetDebate: () => void;
  selectedParties: PartyPersona[];
  setTopic: (topic: string) => void;
  setUserInterjection: (value: string) => void;
  startDebate: () => void;
  streamingEntryId: string | null;
  toggleAutoMode: () => void;
  toggleParty: (party: PartyPersona) => void;
  topic: string;
  transcriptContainerRef: RefObject<HTMLDivElement | null>;
  userInterjection: string;
}

/** Owns all state and streaming logic for the debate page; the page itself only renders. */
export function useDebate(): UseDebateResult {
  const [selectedParties, setSelectedParties] = useState<PartyPersona[]>([]);
  const [topic, setTopic] = useState("");
  const [debateStarted, setDebateStarted] = useState(false);
  const [debateFinished, setDebateFinished] = useState(false);
  const [history, setHistory] = useState<DebateEntry[]>([]);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const currentSpeakerRef = useRef<string | null>(null);
  // Id of the history entry currently being filled in by a stream, so it can be rendered in place
  // (with pendingText as its live content) instead of as a separate element outside the list.
  const [streamingEntryId, setStreamingEntryId] = useState<string | null>(null);
  const streamingEntryIdRef = useRef<string | null>(null);
  const [pendingText, setPendingText] = useState("");
  const [userInterjection, setUserInterjection] = useState("");
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [autoMode, setAutoMode] = useState(false);
  // Latest-value refs, read after an `await` (once a reply finishes) where the closure that
  // started the request may otherwise see stale values if the user paused or ended it meanwhile.
  const autoModeRef = useRef(false);
  const debateFinishedRef = useRef(false);
  const historyRef = useRef<DebateEntry[]>([]);
  autoModeRef.current = autoMode;
  debateFinishedRef.current = debateFinished;
  historyRef.current = history;
  const autoModeSpeakerQueueRef = useRef<string[]>([]);
  // Tracks who spoke last regardless of currentSpeakerId (which resets to null between turns), so a
  // freshly-shuffled queue can avoid opening with whoever just closed the previous round.
  const lastSpeakerIdRef = useRef<string | null>(null);
  const turnCountRef = useRef(0);

  // Shuffles a fresh speaking-order queue if the current one is empty, then pops the next speaker.
  // Swaps the new queue's opening speaker if it would repeat the previous round's closing speaker.
  const takeNextAutoSpeaker = (lastSpeakerId: string | null): string | undefined => {
    if (autoModeSpeakerQueueRef.current.length === 0) {
      const shuffled = shuffleArray(selectedParties.map((party) => party.id));
      if (shuffled.length > 1 && shuffled[0] === lastSpeakerId) {
        [shuffled[0], shuffled[1]] = [shuffled[1] as PartyId, shuffled[0] as PartyId];
      }
      autoModeSpeakerQueueRef.current = shuffled;
    }
    return autoModeSpeakerQueueRef.current.shift();
  };

  // Clears everything that marks a turn as "in flight" once it's resolved one way or another.
  const clearStreamingState = (): void => {
    setPendingText("");
    setCurrentSpeakerId(null);
    currentSpeakerRef.current = null;
    setStreamingEntryId(null);
    streamingEntryIdRef.current = null;
  };

  // Fills in the streaming placeholder entry (added when this turn started, see generateSpeech)
  // with its final text, keyed by id so it updates in place instead of appending a new entry.
  // That keeps it in its original chronological slot even if a user interjection was appended to
  // history while this reply was still streaming — appending fresh would silently reorder it after
  // that interjection. Guards on streamingEntryIdRef so a duplicate call (onFinish firing after
  // the awaited complete() already resolved, or vice versa) is a harmless no-op the second time.
  const resolveStreamingEntry = (speakerId: string, rawText: string): void => {
    const party = PARTIES.find((candidateParty) => candidateParty.id === speakerId);
    const cleaned = cleanText(rawText);
    const entryId = streamingEntryIdRef.current;
    if (!party || !cleaned || !entryId) return;

    lastSpeakerIdRef.current = speakerId;

    const resolvedHistory = historyRef.current.map((entry) =>
      entry.id === entryId ? { ...entry, sources: extractSources(rawText), text: cleaned } : entry,
    );
    historyRef.current = resolvedHistory;
    setHistory(resolvedHistory);
    clearStreamingState();
  };

  const { completion, complete, isLoading, stop } = useCompletion({
    api: "/api/debate",
    onFinish: (_prompt, completionText) => {
      const speaker = currentSpeakerRef.current;
      if (speaker && completionText) {
        resolveStreamingEntry(speaker, completionText);
      }
    },
    streamProtocol: "text",
  });

  // Abort any in-flight reply when the user navigates away, and stop auto mode's chain from
  // continuing — aborting the current fetch alone doesn't stop it, since the recursive call in
  // generateSpeech that kicks off the *next* speaker runs after `complete()` settles regardless of
  // why it settled, and only checks refs (debateFinishedRef), never the fact that this hook unmounted.
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    return () => {
      debateFinishedRef.current = true;
      stopRef.current();
    };
  }, []);

  // Update pending text as completion streams
  useEffect(() => {
    if (isLoading && completion) {
      setPendingText(cleanText(sanitizeSpeech(completion)));
    }
  }, [completion, isLoading]);

  // Auto-scroll ONLY inside the chat container, and only when a new turn is added — not on every
  // streamed chunk, so scrolling up to re-read earlier replies during generation isn't fought.
  const historyLength = history.length;
  useEffect(() => {
    if (historyLength > 0 && transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [historyLength]);

  // Also snap to bottom the instant a new speaker starts — in auto mode, turns can chain back to
  // back fast enough that waiting for the pendingText/near-bottom check below to catch up lags visibly.
  useEffect(() => {
    if (currentSpeakerId && transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [currentSpeakerId]);

  // Also follow a reply while it streams, but only if the transcript was already scrolled near
  // the bottom — otherwise a long reply grows past the fixed-height box out of view, while someone
  // scrolled up to re-read an earlier turn keeps their position undisturbed.
  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (!container || !pendingText) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 120) {
      container.scrollTop = container.scrollHeight;
    }
  }, [pendingText]);

  const toggleParty = (party: PartyPersona): void => {
    setSelectedParties((prev) => {
      const isAlreadySelected = prev.find((selectedParty) => selectedParty.id === party.id);
      if (isAlreadySelected) {
        return prev.filter((selectedParty) => selectedParty.id !== party.id);
      }
      return [...prev, party];
    });
  };

  // Always allowed, even mid-stream — the moderator entry lands in history right away, and either
  // the next auto-mode turn or a manual party click picks it up (generateSpeech reads history fresh).
  const handleUserInterjection = (): void => {
    if (!userInterjection.trim() || debateFinished) return;
    const userEntry: DebateEntry = {
      id: crypto.randomUUID(),
      sources: [],
      speakerId: "user",
      speakerName: MODERATOR_NAME,
      text: userInterjection.trim(),
    };
    const nextHistory = [...historyRef.current, userEntry];
    setHistory(nextHistory);
    historyRef.current = nextHistory;
    setUserInterjection("");
  };

  // Generates one party's reply and, in auto mode, immediately recurses into the next speaker —
  // a plain function call, not a ref lookup or a separate effect reacting to state, so there's no
  // dependency on a re-render happening before the next turn can start. Reads history from
  // historyRef rather than the closure's own `history`, since that's frozen at whatever it was
  // when this exact call was made and a chained call happens before any re-render could refresh it.
  const generateSpeech = async (partyId: string): Promise<void> => {
    const party = PARTIES.find((candidateParty) => candidateParty.id === partyId);
    if (!party) return;

    let currentHistory = historyRef.current;

    currentSpeakerRef.current = partyId;
    setCurrentSpeakerId(partyId);

    // The API only sees fully-resolved entries — the placeholder below is display-only, added
    // after this snapshot so it doesn't confuse the prompt with an empty entry from this speaker.
    const historyForApi = currentHistory;

    const placeholderId = crypto.randomUUID();
    streamingEntryIdRef.current = placeholderId;
    setStreamingEntryId(placeholderId);
    const placeholderEntry: DebateEntry = {
      id: placeholderId,
      sources: [],
      speakerId: partyId,
      speakerName: party.displayName,
      text: "",
    };
    currentHistory = [...currentHistory, placeholderEntry];
    historyRef.current = currentHistory;
    setHistory(currentHistory);

    const finalResult = await complete("", {
      body: {
        history: historyForApi,
        nextSpeakerId: partyId,
        selectedParties: selectedParties.map((selectedParty) => selectedParty.id),
        topic,
      },
    });

    const activeSpeaker = partyId;
    if (finalResult) {
      resolveStreamingEntry(activeSpeaker, sanitizeSpeech(finalResult));
    } else {
      // Nothing came back (e.g. network error) — drop the empty placeholder instead of leaving a
      // permanent blank bubble in the transcript.
      const withoutPlaceholder = historyRef.current.filter((entry) => entry.id !== placeholderId);
      historyRef.current = withoutPlaceholder;
      setHistory(withoutPlaceholder);
      clearStreamingState();
    }

    // Auto mode: chain straight into the next speaker once this reply is done. Re-reads
    // autoMode/debateFinished from refs since this call may have started well before the user
    // paused or ended things.
    turnCountRef.current += 1;
    if (autoModeRef.current && !debateFinishedRef.current && turnCountRef.current < MAX_DEBATE_TURNS) {
      const nextSpeakerId = takeNextAutoSpeaker(lastSpeakerIdRef.current);
      if (nextSpeakerId) {
        generateSpeech(nextSpeakerId);
      }
    } else if (turnCountRef.current >= MAX_DEBATE_TURNS && !debateFinishedRef.current) {
      setDebateFinished(true);
      debateFinishedRef.current = true;
      setAutoMode(false);
      autoModeRef.current = false;
      clearStreamingState();
    }
  };

  // Public entry point for clicks (stage avatars, speaker selector): guards against starting a
  // second request while one is already in flight, then hands off to generateSpeech.
  const handleSelectSpeaker = async (partyId: string): Promise<void> => {
    if (isLoading || debateFinished) return;
    await generateSpeech(partyId);
  };

  // Manual stepping: advance to next speaker when auto-mode is paused.
  const handleNextSpeaker = (): void => {
    if (isLoading || debateFinished || autoMode) return;
    const nextSpeakerId = takeNextAutoSpeaker(lastSpeakerIdRef.current);
    if (nextSpeakerId) {
      generateSpeech(nextSpeakerId);
    }
  };

  // Starts in auto mode with a randomly picked opening speaker, so the debate runs on its own
  // from the moment it starts instead of waiting for the user to press play.
  const startDebate = (): void => {
    if (selectedParties.length < 2 || !topic.trim()) return;
    setDebateStarted(true);
    setHistory([]);
    historyRef.current = [];
    setDebateFinished(false);
    setAutoMode(true);
    autoModeSpeakerQueueRef.current = [];
    turnCountRef.current = 0;

    const openingSpeaker = selectedParties[Math.floor(Math.random() * selectedParties.length)];
    if (openingSpeaker) {
      generateSpeech(openingSpeaker.id);
    }
  };

  // Toggling auto mode back on while the debate is idle (paused between turns) has no in-flight
  // reply to chain off of, so it needs to kick off the next speaker itself. The speech kickoff runs
  // after setAutoMode, not inside its updater — a setState updater must stay pure, and generateSpeech
  // itself calls setState (React double-invokes updaters in dev Strict Mode to catch exactly this).
  const toggleAutoMode = (): void => {
    const next = !autoMode;
    setAutoMode(next);
    if (next && !isLoading && !debateFinished && selectedParties.length >= 2) {
      const nextSpeakerId = takeNextAutoSpeaker(lastSpeakerIdRef.current);
      if (nextSpeakerId) {
        generateSpeech(nextSpeakerId);
      }
    }
  };

  // Cancel a running speech: abort the stream, keep whatever text arrived so far as the final
  // entry (onFinish never fires on an aborted stream), then snap the transcript to the bottom.
  // Also pauses auto mode — a manual cancel shouldn't be immediately overridden by the next auto turn.
  const handleStop = (): void => {
    if (!isLoading) return;
    const speaker = currentSpeakerRef.current;
    const entryId = streamingEntryIdRef.current;
    stop();
    setAutoMode(false);
    if (speaker && completion) {
      resolveStreamingEntry(speaker, completion);
    } else if (entryId) {
      // Stopped before any text streamed back — drop the empty placeholder rather than leave it.
      const withoutPlaceholder = historyRef.current.filter((entry) => entry.id !== entryId);
      historyRef.current = withoutPlaceholder;
      setHistory(withoutPlaceholder);
      clearStreamingState();
    }
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  };

  const endDebate = (): void => {
    setDebateFinished(true);
    setCurrentSpeakerId(null);
    setAutoMode(false);
  };

  const resetDebate = (): void => {
    setDebateStarted(false);
    setDebateFinished(false);
    setHistory([]);
    historyRef.current = [];
    setSelectedParties([]);
    setTopic("");
    setCurrentSpeakerId(null);
    setPendingText("");
    setUserInterjection("");
    setStreamingEntryId(null);
    streamingEntryIdRef.current = null;
    setAutoMode(false);
    autoModeSpeakerQueueRef.current = [];
    lastSpeakerIdRef.current = null;
    turnCountRef.current = 0;
  };

  let currentSpeakerParty: PartyPersona | null | undefined;
  if (currentSpeakerId) {
    currentSpeakerParty = PARTIES.find((candidateParty) => candidateParty.id === currentSpeakerId);
  } else {
    currentSpeakerParty = null;
  }

  return {
    autoMode,
    currentSpeakerId,
    currentSpeakerParty,
    debateFinished,
    debateStarted,
    endDebate,
    handleNextSpeaker,
    handleSelectSpeaker,
    handleStop,
    handleUserInterjection,
    history,
    isLoading,
    pendingText,
    resetDebate,
    selectedParties,
    setTopic,
    setUserInterjection,
    startDebate,
    streamingEntryId,
    toggleAutoMode,
    toggleParty,
    topic,
    transcriptContainerRef,
    userInterjection,
  };
}
