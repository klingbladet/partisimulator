import { useCompletion } from "@ai-sdk/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { isDuplicateOfLastEntry } from "@/lib/history";
import { PARTIES } from "@/lib/parties";
import { cleanText, extractSources } from "@/lib/sources";
import type { DebateEntry } from "@/types/debate";
import type { PartyPersona } from "@/types/party";

const MODERATOR_NAME = "Du (Debattledare)";

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

  // Shuffles a fresh speaking-order queue if the current one is empty, then pops the next speaker.
  const takeNextAutoSpeaker = (): string | undefined => {
    if (autoModeSpeakerQueueRef.current.length === 0) {
      autoModeSpeakerQueueRef.current = shuffleArray(selectedParties.map((party) => party.id));
    }
    return autoModeSpeakerQueueRef.current.shift();
  };

  // Returns the entry it built (even if React state already had it via the onFinish/complete
  // duplicate path below) so callers can update historyRef immediately, without waiting on a
  // re-render to see it reflected in `history`.
  const addSpeechToHistory = (speakerId: string, rawText: string): DebateEntry | null => {
    const party = PARTIES.find((candidateParty) => candidateParty.id === speakerId);
    const cleaned = cleanText(rawText);
    if (!party || !cleaned) return null;

    const entry: DebateEntry = {
      id: crypto.randomUUID(),
      sources: extractSources(rawText),
      speakerId,
      speakerName: party.displayName,
      text: cleaned,
    };

    setHistory((prev) => {
      // Prevent duplicate additions if both onFinish and complete return
      if (
        isDuplicateOfLastEntry(prev, (lastEntry) => lastEntry.speakerId === speakerId && lastEntry.text === cleaned)
      ) {
        return prev;
      }
      return [...prev, entry];
    });
    setPendingText("");
    setCurrentSpeakerId(null);
    currentSpeakerRef.current = null;
    return entry;
  };

  const { completion, complete, isLoading, stop } = useCompletion({
    api: "/api/debate",
    onFinish: (_prompt, completionText) => {
      const speaker = currentSpeakerRef.current;
      if (speaker && completionText) {
        addSpeechToHistory(speaker, completionText);
      }
    },
    streamProtocol: "text",
  });

  // Update pending text as completion streams
  useEffect(() => {
    if (isLoading && completion) {
      setPendingText(cleanText(completion));
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

  const handleUserInterjection = (): void => {
    if (!userInterjection.trim() || isLoading || debateFinished) return;
    const userEntry: DebateEntry = {
      id: crypto.randomUUID(),
      sources: [],
      speakerId: "user",
      speakerName: MODERATOR_NAME,
      text: userInterjection.trim(),
    };
    const nextHistory = [...history, userEntry];
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
    if (userInterjection.trim()) {
      const userEntry: DebateEntry = {
        id: crypto.randomUUID(),
        sources: [],
        speakerId: "user",
        speakerName: MODERATOR_NAME,
        text: userInterjection.trim(),
      };
      currentHistory = [...currentHistory, userEntry];
      setHistory(currentHistory);
      historyRef.current = currentHistory;
      setUserInterjection("");
    }

    currentSpeakerRef.current = partyId;
    setCurrentSpeakerId(partyId);

    const finalResult = await complete("", {
      body: {
        history: currentHistory,
        nextSpeakerId: partyId,
        selectedParties: selectedParties.map((selectedParty) => selectedParty.id),
        topic,
      },
    });

    if (finalResult) {
      const addedEntry = addSpeechToHistory(partyId, finalResult);
      if (addedEntry) {
        historyRef.current = [...currentHistory, addedEntry];
      }
    }

    // Auto mode: chain straight into the next speaker once this reply is done. Re-reads
    // autoMode/debateFinished from refs since this call may have started well before the user
    // paused or ended things.
    if (autoModeRef.current && !debateFinishedRef.current) {
      const nextSpeakerId = takeNextAutoSpeaker();
      if (nextSpeakerId) {
        generateSpeech(nextSpeakerId);
      }
    }
  };

  // Public entry point for clicks (stage avatars, speaker selector): guards against starting a
  // second request while one is already in flight, then hands off to generateSpeech.
  const handleSelectSpeaker = async (partyId: string): Promise<void> => {
    if (isLoading || debateFinished) return;
    await generateSpeech(partyId);
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
      const nextSpeakerId = takeNextAutoSpeaker();
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
    stop();
    setAutoMode(false);
    if (speaker && completion) {
      addSpeechToHistory(speaker, completion);
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
    setAutoMode(false);
    autoModeSpeakerQueueRef.current = [];
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
    toggleAutoMode,
    toggleParty,
    topic,
    transcriptContainerRef,
    userInterjection,
  };
}
