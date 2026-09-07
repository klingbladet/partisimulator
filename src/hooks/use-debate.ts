import { useCompletion } from "@ai-sdk/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { buildNoAnswerFallback } from "@/lib/no-answer";
import { PARTIES } from "@/lib/parties";
import { sanitizeSpeech } from "@/lib/sanitize";
import { shuffleArray } from "@/lib/shuffle";
import { cleanText, extractSources } from "@/lib/sources";
import { MAX_HISTORY_ENTRIES } from "@/lib/validation";
import type { DebateEntry } from "@/types/debate";
import type { PartyId, PartyPersona } from "@/types/party";

const MODERATOR_NAME = "Du (Debattledare)";
// Caps how many turns auto mode will chain through unattended before pausing itself; manual
// stepping via "Nästa replik" is never capped.
const AUTO_MODE_TURN_CAP = 20;

// "opening" gets the debate's welcome announcement; "targeted" skips the moderator line entirely
// since the interjection that picked this speaker already named them; "closing" gets each party's
// final-statement announcement instead of the regular "next up" one.
type TurnKind = "closing" | "opening" | "regular" | "targeted";

/** The moderator's announcement line for a turn, based on what kind of turn it is. */
function buildModeratorText(
  turnKind: Exclude<TurnKind, "targeted">,
  party: PartyPersona,
  topic: string,
  selectedParties: PartyPersona[],
): string {
  const firstName = party.displayName.split(" ")[0];
  if (turnKind === "opening") {
    const partyList = new Intl.ListFormat("sv", { style: "long", type: "conjunction" }).format(
      selectedParties.map((selectedParty) => selectedParty.partyName),
    );
    return `Välkomna till dagens debatt mellan ${partyList}! Dagens fråga är: "${topic}". Först ut är ${firstName} från ${party.partyName} - varsågod!`;
  }
  if (turnKind === "closing") {
    return `Dags för slutplädering: ${firstName} från ${party.partyName}, sammanfatta ert budskap!`;
  }
  return `Turen går till ${firstName} från ${party.partyName}`;
}

interface UseDebateResult {
  autoMode: boolean;
  currentSpeakerId: string | null;
  currentSpeakerParty: PartyPersona | null | undefined;
  debateFinished: boolean;
  debateStarted: boolean;
  endDebate: () => void;
  handleNextSpeaker: () => void;
  handleStop: () => void;
  handleUserInterjection: () => void;
  history: DebateEntry[];
  isEndingDebate: boolean;
  isLoading: boolean;
  pendingText: string;
  resetDebate: () => void;
  selectedParties: PartyPersona[];
  setTargetSpeakerId: (partyId: string | null) => void;
  setTopic: (topic: string) => void;
  setUserInterjection: (value: string) => void;
  startDebate: () => void;
  streamingEntryId: string | null;
  targetSpeakerId: string | null;
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
  // Lets the moderator aim a question at a specific party instead of whoever's next in the shuffle
  // queue; cleared once it's used so it never lingers onto a later, unrelated question.
  const [targetSpeakerId, setTargetSpeakerId] = useState<string | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [autoMode, setAutoMode] = useState(false);
  // True from the moment "Avsluta" is confirmed until every party has given its closing statement —
  // gates the other controls so nothing else can interleave a turn into the closing round.
  const [isEndingDebate, setIsEndingDebate] = useState(false);
  // Latest-value refs, read after an `await` (once a reply finishes) where the closure that
  // started the request may otherwise see stale values if the user paused or ended it meanwhile.
  const autoModeRef = useRef(false);
  const debateFinishedRef = useRef(false);
  const historyRef = useRef<DebateEntry[]>([]);
  const targetSpeakerIdRef = useRef<string | null>(null);
  const isEndingDebateRef = useRef(false);
  autoModeRef.current = autoMode;
  debateFinishedRef.current = debateFinished;
  historyRef.current = history;
  targetSpeakerIdRef.current = targetSpeakerId;
  isEndingDebateRef.current = isEndingDebate;
  const autoModeSpeakerQueueRef = useRef<string[]>([]);
  // Remaining speakers still owed a closing statement, once "Avsluta" has been confirmed.
  const closingQueueRef = useRef<string[] | null>(null);
  // Tracks who spoke last regardless of currentSpeakerId (which resets to null between turns), so a
  // freshly-shuffled queue can avoid opening with whoever just closed the previous round.
  const lastSpeakerIdRef = useRef<string | null>(null);
  const turnCountRef = useRef(0);
  // Set right before a manual stop. handleStop resolves (or drops) the streaming placeholder
  // itself, synchronously, before the aborted complete() call below settles — so once it does
  // settle, stoppedRef tells generateSpeech's cleanup to leave that entry alone rather than
  // re-touching (or deleting) whatever handleStop already put there.
  const stoppedRef = useRef(false);

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

  // Every "who speaks next" decision goes through here, so a party targeted via the interjection
  // picker is honored whenever a turn actually opens up — including a turn that opens up later
  // (auto mode's own chain, or the next manual "Nästa talare" click), not just one starting right
  // this instant. Reads/clears the ref directly rather than waiting on the setState + re-render,
  // since a chained call can run again before React commits that update. `isTargeted` tells
  // generateSpeech to skip its own "Turen går till" announcement, since the interjection that
  // targeted this party already addressed them by name.
  const pickNextSpeaker = (): { speakerId: string; isTargeted: boolean } | undefined => {
    const requestedSpeakerId = targetSpeakerIdRef.current;
    if (requestedSpeakerId) {
      targetSpeakerIdRef.current = null;
      setTargetSpeakerId(null);
      return { isTargeted: true, speakerId: requestedSpeakerId };
    }
    const speakerId = takeNextAutoSpeaker(lastSpeakerIdRef.current);
    return speakerId ? { isTargeted: false, speakerId } : undefined;
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
    const entryId = streamingEntryIdRef.current;
    if (!party || !entryId) return;

    lastSpeakerIdRef.current = speakerId;

    const cleaned = cleanText(rawText);
    if (!cleaned) {
      if (stoppedRef.current) {
        // User cut the turn off manually before anything usable arrived — drop the placeholder
        // rather than leave a permanent blank bubble, same as the "nothing came back" branches.
        const withoutPlaceholder = historyRef.current.filter((entry) => entry.id !== entryId);
        historyRef.current = withoutPlaceholder;
        setHistory(withoutPlaceholder);
        clearStreamingState();
        return;
      }
      // Sanitizing removed everything (e.g. the whole raw reply was a leaked reasoning preamble) —
      // show the in-character fallback instead of leaving a permanent blank bubble.
      const fallback = buildNoAnswerFallback(party);
      const fallbackHistory = historyRef.current.map((entry) =>
        entry.id === entryId ? { ...entry, manifestUrl: fallback.manifestUrl, text: fallback.text } : entry,
      );
      historyRef.current = fallbackHistory;
      setHistory(fallbackHistory);
      clearStreamingState();
      return;
    }

    const resolvedHistory = historyRef.current.map((entry) =>
      entry.id === entryId ? { ...entry, sources: extractSources(rawText), text: cleaned } : entry,
    );
    historyRef.current = resolvedHistory;
    setHistory(resolvedHistory);
    clearStreamingState();
  };

  const { completion, complete, isLoading, stop } = useCompletion({
    api: "/api/debate",
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

  // Always allowed, even mid-stream — the moderator entry lands in history right away. If a party
  // was targeted, the entry addresses them by name directly (so generateSpeech can skip its own
  // "Turen går till" line once their turn actually comes up — see the "targeted" TurnKind).
  // If nothing's in flight and auto mode isn't already chaining its own turns, answer right away
  // instead of waiting for a separate "Nästa talare" click. If a reply is streaming or auto mode is
  // running, leave targetSpeakerId untouched rather than firing here — pickNextSpeaker consumes it
  // whenever the next turn actually opens up (the auto-chain's own continuation, or the next manual click).
  const handleUserInterjection = (): void => {
    const question = userInterjection.trim();
    if (!question || debateFinished) return;

    const targetedParty = PARTIES.find((candidateParty) => candidateParty.id === targetSpeakerId);
    const userEntry: DebateEntry = {
      id: crypto.randomUUID(),
      sources: [],
      speakerId: "user",
      speakerName: MODERATOR_NAME,
      text: targetedParty
        ? `Kan du svara på följande fråga, ${targetedParty.displayName.split(" ")[0]} från ${targetedParty.partyName}: ${question}`
        : question,
    };
    const nextHistory = [...historyRef.current, userEntry];
    setHistory(nextHistory);
    historyRef.current = nextHistory;
    setUserInterjection("");

    if (!isLoading && !autoMode && !isEndingDebate) {
      const nextSpeaker = pickNextSpeaker();
      if (nextSpeaker) {
        generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
      }
    }
  };

  // Generates one party's reply and, in auto mode, immediately recurses into the next speaker —
  // a plain function call, not a ref lookup or a separate effect reacting to state, so there's no
  // dependency on a re-render happening before the next turn can start. Reads history from
  // historyRef rather than the closure's own `history`, since that's frozen at whatever it was
  // when this exact call was made and a chained call happens before any re-render could refresh it.
  const generateSpeech = async (partyId: string, turnKind: TurnKind = "regular"): Promise<void> => {
    const party = PARTIES.find((candidateParty) => candidateParty.id === partyId);
    if (!party) return;

    let currentHistory = historyRef.current;

    stoppedRef.current = false;
    currentSpeakerRef.current = partyId;
    setCurrentSpeakerId(partyId);

    if (turnKind !== "targeted") {
      const moderatorEntry: DebateEntry = {
        id: crypto.randomUUID(),
        sources: [],
        speakerId: "user",
        speakerName: MODERATOR_NAME,
        text: buildModeratorText(turnKind, party, topic, selectedParties),
      };
      currentHistory = [...currentHistory, moderatorEntry];
    }

    // The API only sees fully-resolved entries — the placeholder below is display-only, added
    // after this snapshot so it doesn't confuse the prompt with an empty entry from this speaker.
    // Windowed to the server's own cap: the full transcript (shown in the UI) grows without limit
    // over a long debate, but debateRequestSchema rejects a history over MAX_HISTORY_ENTRIES, so
    // sending the whole thing verbatim would make every turn past that point fail outright once
    // the debate runs long enough — including every auto-mode turn after a "vill du fortsätta?"
    // confirmation, since resuming doesn't undo how much history has already piled up.
    const historyForApi = currentHistory.slice(-MAX_HISTORY_ENTRIES);

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
        isClosingStatement: turnKind === "closing",
        nextSpeakerId: partyId,
        selectedParties: selectedParties.map((selectedParty) => selectedParty.id),
        topic,
      },
    });

    settleTurn(party, placeholderId, finalResult);
    continueAfterTurn(turnKind);
  };

  // After the API call settles, updates history with the final reply — or, if nothing usable came
  // back and the user didn't stop it manually, the in-character fallback. If the user did stop it,
  // handleStop already resolved (or dropped) this entry synchronously, before this aborted
  // complete() call settled, so there's nothing left to do here.
  const settleTurn = (party: PartyPersona, placeholderId: string, finalResult: string | null | undefined): void => {
    if (finalResult) {
      resolveStreamingEntry(party.id, sanitizeSpeech(finalResult));
      return;
    }
    if (stoppedRef.current) return;
    // Nothing came back (e.g. network error) — show the in-character fallback instead of leaving a
    // permanent blank bubble in the transcript.
    const fallback = buildNoAnswerFallback(party);
    const fallbackHistory = historyRef.current.map((entry) =>
      entry.id === placeholderId ? { ...entry, manifestUrl: fallback.manifestUrl, text: fallback.text } : entry,
    );
    historyRef.current = fallbackHistory;
    setHistory(fallbackHistory);
    clearStreamingState();
  };

  // Closing round: chain straight into the next party still owed a statement, in the order fixed
  // when "Avsluta" was confirmed — once the queue is empty, the debate actually ends. Bails out
  // silently if the component unmounted mid-round (debateFinishedRef is forced true then), same
  // guard continueAutoMode uses.
  const continueClosingRound = (): void => {
    if (debateFinishedRef.current) return;
    const nextClosingSpeakerId = closingQueueRef.current?.shift();
    if (nextClosingSpeakerId) {
      generateSpeech(nextClosingSpeakerId, "closing");
    } else {
      finishDebate();
    }
  };

  // Auto mode: chain straight into the next speaker once this reply is done. Re-reads
  // autoMode/debateFinished from refs since this call may have started well before the user
  // paused or ended things.
  const continueAutoMode = (): void => {
    turnCountRef.current += 1;
    if (turnCountRef.current < AUTO_MODE_TURN_CAP) {
      const nextSpeaker = pickNextSpeaker();
      if (nextSpeaker) {
        generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
      }
      return;
    }
    // Hit the auto-mode ceiling: pause and let the user decide whether to keep going, rather than
    // silently ending the debate or running away unattended forever.
    setAutoMode(false);
    autoModeRef.current = false;
    const shouldContinue = window.confirm(
      `Debatten har nått ${AUTO_MODE_TURN_CAP} repliker i automatiskt läge. Vill du fortsätta?`,
    );
    if (shouldContinue && !debateFinishedRef.current) {
      turnCountRef.current = 0;
      setAutoMode(true);
      autoModeRef.current = true;
      const nextSpeaker = pickNextSpeaker();
      if (nextSpeaker) {
        generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
      }
    }
  };

  // Manual mode (no auto-chain to pick this up on its own), but a party was targeted while this
  // turn was still in flight — answer it now instead of leaving the debate silently paused until
  // an extra "Nästa talare" click. Doesn't interrupt the reply that just finished, just follows it.
  const continueTargetedManualTurn = (): void => {
    if (!targetSpeakerIdRef.current || debateFinishedRef.current || isEndingDebateRef.current) return;
    const nextSpeaker = pickNextSpeaker();
    if (nextSpeaker) {
      generateSpeech(nextSpeaker.speakerId, "targeted");
    }
  };

  // Once a turn has settled, decides whether — and how — the next one starts: a closing round
  // takes priority, then auto mode's own chain, then a manual-mode party that got targeted while
  // this turn was still in flight. Manual turns (autoMode off) never touch turnCountRef, so
  // stepping through "Nästa replik" by hand is never capped.
  const continueAfterTurn = (turnKind: TurnKind): void => {
    if (turnKind === "closing") {
      continueClosingRound();
    } else if (autoModeRef.current && !debateFinishedRef.current) {
      continueAutoMode();
    } else {
      continueTargetedManualTurn();
    }
  };

  // Manual stepping: advance to next speaker when auto-mode is paused.
  const handleNextSpeaker = (): void => {
    if (isLoading || debateFinished || autoMode || isEndingDebate) return;
    const nextSpeaker = pickNextSpeaker();
    if (nextSpeaker) {
      generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
    }
  };

  // Starts paused with a randomly picked opening speaker — the user steps through turns by hand
  // (or presses play to switch to auto mode) rather than the debate running on its own by default.
  const startDebate = (): void => {
    if (selectedParties.length < 2 || !topic.trim()) return;
    setDebateStarted(true);
    setHistory([]);
    historyRef.current = [];
    setDebateFinished(false);
    setAutoMode(false);
    autoModeRef.current = false;
    autoModeSpeakerQueueRef.current = [];
    turnCountRef.current = 0;

    const openingSpeaker = selectedParties[Math.floor(Math.random() * selectedParties.length)];
    if (openingSpeaker) {
      generateSpeech(openingSpeaker.id, "opening");
    }
  };

  // Toggling auto mode back on while the debate is idle (paused between turns) has no in-flight
  // reply to chain off of, so it needs to kick off the next speaker itself. The speech kickoff runs
  // after setAutoMode, not inside its updater — a setState updater must stay pure, and generateSpeech
  // itself calls setState (React double-invokes updaters in dev Strict Mode to catch exactly this).
  const toggleAutoMode = (): void => {
    if (isEndingDebate) return;
    const next = !autoMode;
    setAutoMode(next);
    if (next) {
      // Fresh cap for each auto-mode stint, so pausing and resuming doesn't inherit a count from
      // an earlier run.
      turnCountRef.current = 0;
      if (!isLoading && !debateFinished && selectedParties.length >= 2) {
        const nextSpeaker = pickNextSpeaker();
        if (nextSpeaker) {
          generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
        }
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
    stoppedRef.current = true;
    stop();
    setAutoMode(false);
    if (speaker && completion) {
      resolveStreamingEntry(speaker, sanitizeSpeech(completion));
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

  // Actually ends the debate, once every party has had its closing statement (or there were none to give).
  const finishDebate = (): void => {
    setDebateFinished(true);
    setCurrentSpeakerId(null);
    setAutoMode(false);
    setIsEndingDebate(false);
    closingQueueRef.current = null;
  };

  // "Avsluta" doesn't end the debate outright — it gives every participating party one final
  // closing statement first (in a freshly shuffled order), then finishDebate ends it for real.
  const endDebate = (): void => {
    if (debateFinished || isEndingDebate) return;
    setAutoMode(false);
    autoModeRef.current = false;
    setIsEndingDebate(true);
    setTargetSpeakerId(null);
    targetSpeakerIdRef.current = null;
    const closingOrder = shuffleArray(selectedParties.map((party) => party.id));
    const firstSpeakerId = closingOrder.shift();
    closingQueueRef.current = closingOrder;
    if (firstSpeakerId) {
      generateSpeech(firstSpeakerId, "closing");
    } else {
      finishDebate();
    }
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
    setTargetSpeakerId(null);
    setStreamingEntryId(null);
    streamingEntryIdRef.current = null;
    setAutoMode(false);
    setIsEndingDebate(false);
    closingQueueRef.current = null;
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
    handleStop,
    handleUserInterjection,
    history,
    isEndingDebate,
    isLoading,
    pendingText,
    resetDebate,
    selectedParties,
    setTargetSpeakerId,
    setTopic,
    setUserInterjection,
    startDebate,
    streamingEntryId,
    targetSpeakerId,
    toggleAutoMode,
    toggleParty,
    topic,
    transcriptContainerRef,
    userInterjection,
  };
}
