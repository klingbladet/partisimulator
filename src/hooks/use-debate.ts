import { useCompletion } from "@ai-sdk/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { type TurnKind, useDebateSequencing } from "@/hooks/use-debate-sequencing";
import { useDebateTranscript } from "@/hooks/use-debate-transcript";
import { PARTIES } from "@/lib/parties";
import { sanitizeSpeech } from "@/lib/sanitize";
import { cleanText } from "@/lib/sources";
import { MAX_HISTORY_ENTRIES } from "@/lib/validation";
import type { DebateEntry } from "@/types/debate";
import type { PartyPersona } from "@/types/party";

export { AUTO_MODE_TURN_CAP } from "@/hooks/use-debate-sequencing";

const MODERATOR_NAME = "Du (Debattledare)";

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
  confirmContinueAfterCap: () => void;
  currentSpeakerId: string | null;
  currentSpeakerParty: PartyPersona | null | undefined;
  debateFinished: boolean;
  debateStarted: boolean;
  dismissTurnCapDialog: () => void;
  endDebate: () => void;
  handleNextSpeaker: () => void;
  handleStop: () => void;
  handleUserInterjection: () => void;
  history: DebateEntry[];
  isEndingDebate: boolean;
  isLoading: boolean;
  pendingText: string;
  regenerateEntry: (entryId: string) => Promise<void>;
  resetDebate: () => void;
  selectedParties: PartyPersona[];
  setTargetSpeakerId: (partyId: string | null) => void;
  setTopic: (topic: string) => void;
  setUserInterjection: (value: string) => void;
  showTurnCapDialog: boolean;
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
  const [userInterjection, setUserInterjection] = useState("");
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const transcript = useDebateTranscript();
  const sequencing = useDebateSequencing({
    lastSpeakerIdRef: transcript.lastSpeakerIdRef,
    selectedParties,
  });

  const { completion, complete, isLoading, stop } = useCompletion({
    api: "/api/debate",
    streamProtocol: "text",
  });

  // Abort any in-flight reply when the user navigates away, and stop auto mode's chain from
  // continuing.
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    return () => {
      sequencing.markDebateFinishedOnUnmount();
      stopRef.current();
    };
  }, [sequencing.markDebateFinishedOnUnmount]);

  // Update pending text as completion streams
  useEffect(() => {
    if (isLoading && completion) {
      transcript.setPendingText(cleanText(sanitizeSpeech(completion)));
    }
  }, [completion, isLoading, transcript.setPendingText]);

  // Auto-scroll ONLY inside the chat container, and only when a new turn is added - not on every
  // streamed chunk, so scrolling up to re-read earlier replies during generation isn't fought.
  const historyLength = transcript.history.length;
  useEffect(() => {
    if (historyLength > 0 && transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [historyLength]);

  // Also snap to bottom the instant a new speaker starts - in auto mode, turns can chain back to
  // back fast enough that waiting for the pendingText/near-bottom check below to catch up lags visibly.
  useEffect(() => {
    if (transcript.currentSpeakerId && transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript.currentSpeakerId]);

  // Also follow a reply while it streams, but only if the transcript was already scrolled near
  // the bottom - otherwise a long reply grows past the fixed-height box out of view, while someone
  // scrolled up to re-read an earlier turn keeps their position undisturbed.
  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (!container || !transcript.pendingText) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 120) {
      container.scrollTop = container.scrollHeight;
    }
  }, [transcript.pendingText]);

  const toggleParty = (party: PartyPersona): void => {
    setSelectedParties((prev) => {
      const isAlreadySelected = prev.find((selectedParty) => selectedParty.id === party.id);
      if (isAlreadySelected) {
        return prev.filter((selectedParty) => selectedParty.id !== party.id);
      }
      return [...prev, party];
    });
  };

  // Always allowed, even mid-stream - the moderator entry lands in history right away. If nothing's
  // in flight and auto mode isn't already chaining its own turns, answer right away instead of
  // waiting for a separate "Nästa talare" click.
  const handleUserInterjection = (): void => {
    const question = userInterjection.trim();
    if (!question || sequencing.debateFinished) return;

    const targetedParty = PARTIES.find((candidateParty) => candidateParty.id === sequencing.targetSpeakerId);
    const userEntry: DebateEntry = {
      id: crypto.randomUUID(),
      sources: [],
      speakerId: "user",
      speakerName: MODERATOR_NAME,
      text: targetedParty
        ? `Kan du svara på följande fråga, ${targetedParty.displayName.split(" ")[0]} från ${targetedParty.partyName}: ${question}`
        : question,
    };
    transcript.setHistory([...transcript.historyRef.current, userEntry]);
    setUserInterjection("");

    if (!isLoading && !sequencing.autoMode && !sequencing.isEndingDebate) {
      const nextSpeaker = sequencing.pickNextSpeaker();
      if (nextSpeaker) {
        generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
      }
    }
  };

  // Generates one party's reply and, in auto mode, immediately recurses into the next speaker -
  // a plain function call, not a ref lookup or a separate effect reacting to state, so there's no
  // dependency on a re-render happening before the next turn can start. Reads history from
  // transcript.historyRef rather than transcript.history, since that's frozen at whatever it was
  // when this exact call was made and a chained call happens before any re-render could refresh it.
  const generateSpeech = async (partyId: string, turnKind: TurnKind = "regular"): Promise<void> => {
    const party = PARTIES.find((candidateParty) => candidateParty.id === partyId);
    if (!party) return;

    let currentHistory = transcript.historyRef.current;

    transcript.stoppedRef.current = false;
    transcript.setCurrentSpeaker(partyId);

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

    // The API only sees fully-resolved entries - the placeholder below is display-only, added
    // after this snapshot so it doesn't confuse the prompt with an empty entry from this speaker.
    // Windowed to the server's own cap: the full transcript (shown in the UI) grows without limit
    // over a long debate, but debateRequestSchema rejects a history over MAX_HISTORY_ENTRIES, so
    // sending the whole thing verbatim would make every turn past that point fail outright once
    // the debate runs long enough - including every auto-mode turn after a "vill du fortsätta?"
    // confirmation, since resuming doesn't undo how much history has already piled up.
    const historyForApi = currentHistory.slice(-MAX_HISTORY_ENTRIES);

    const placeholderId = crypto.randomUUID();
    transcript.setStreamingEntry(placeholderId);
    const placeholderEntry: DebateEntry = {
      id: placeholderId,
      isClosingStatement: turnKind === "closing",
      sources: [],
      speakerId: partyId,
      speakerName: party.displayName,
      text: "",
    };
    currentHistory = [...currentHistory, placeholderEntry];
    transcript.setHistory(currentHistory);

    const finalResult = await complete("", {
      body: {
        history: historyForApi,
        isClosingStatement: turnKind === "closing",
        nextSpeakerId: partyId,
        selectedParties: selectedParties.map((selectedParty) => selectedParty.id),
        topic,
      },
    });

    transcript.settleTurn(party, placeholderId, finalResult);
    continueAfterTurn(turnKind);
  };

  // Re-runs a failed turn's request and updates that same entry in place via the same
  // resolveStreamingEntry/settleTurn machinery a fresh turn uses - it just skips continueAfterTurn,
  // since the turn sequence already moved on past this entry by the time it originally failed.
  const regenerateEntry = async (entryId: string): Promise<void> => {
    if (isLoading || sequencing.isEndingDebate) return;
    const entryIndex = transcript.historyRef.current.findIndex((entry) => entry.id === entryId);
    const entry = transcript.historyRef.current[entryIndex];
    if (entryIndex === -1 || !entry?.isError) return;
    const party = PARTIES.find((candidateParty) => candidateParty.id === entry.speakerId);
    if (!party) return;

    transcript.stoppedRef.current = false;
    transcript.regeneratingEntryIdRef.current = entryId;
    transcript.setCurrentSpeaker(entry.speakerId);
    transcript.setStreamingEntry(entryId);

    const historyForApi = transcript.historyRef.current.slice(0, entryIndex).slice(-MAX_HISTORY_ENTRIES);

    const finalResult = await complete("", {
      body: {
        history: historyForApi,
        isClosingStatement: entry.isClosingStatement ?? false,
        nextSpeakerId: entry.speakerId,
        selectedParties: selectedParties.map((selectedParty) => selectedParty.id),
        topic,
      },
    });

    transcript.settleTurn(party, entryId, finalResult);
  };

  // Acts on sequencing's decision for what happens after a turn settles.
  const continueAfterTurn = (turnKind: TurnKind): void => {
    const decision = sequencing.decideNextTurn(turnKind);
    if (decision.type === "speak") {
      generateSpeech(decision.speakerId, decision.turnKind);
    } else if (decision.type === "finishClosing") {
      finishDebate();
    }
  };

  // Confirms the turn-cap dialog and resumes the chain.
  const confirmContinueAfterCap = (): void => {
    const nextSpeaker = sequencing.confirmContinueAfterCap();
    if (nextSpeaker) {
      generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
    }
  };

  // Manual stepping: advance to next speaker when auto-mode is paused.
  const handleNextSpeaker = (): void => {
    if (isLoading || sequencing.debateFinished || sequencing.autoMode || sequencing.isEndingDebate) return;
    const nextSpeaker = sequencing.pickNextSpeaker();
    if (nextSpeaker) {
      generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
    }
  };

  // Starts paused with a randomly picked opening speaker - the user steps through turns by hand
  // (or presses play to switch to auto mode) rather than the debate running on its own by default.
  const startDebate = (): void => {
    if (selectedParties.length < 2 || !topic.trim()) return;
    setDebateStarted(true);
    transcript.setHistory([]);
    sequencing.startNewDebateRound();

    const openingSpeaker = selectedParties[Math.floor(Math.random() * selectedParties.length)];
    if (openingSpeaker) {
      generateSpeech(openingSpeaker.id, "opening");
    }
  };

  // Toggling auto mode back on while the debate is idle (paused between turns) has no in-flight
  // reply to chain off of, so it needs to kick off the next speaker itself.
  const toggleAutoMode = (): void => {
    if (sequencing.isEndingDebate) return;
    const next = !sequencing.autoMode;
    sequencing.setAutoMode(next);
    if (next) {
      // Fresh cap for each auto-mode stint, so pausing and resuming doesn't inherit a count from
      // an earlier run.
      sequencing.resetTurnCount();
      if (!isLoading && !sequencing.debateFinished && selectedParties.length >= 2) {
        const nextSpeaker = sequencing.pickNextSpeaker();
        if (nextSpeaker) {
          generateSpeech(nextSpeaker.speakerId, nextSpeaker.isTargeted ? "targeted" : "regular");
        }
      }
    }
  };

  // Cancel a running speech: abort the stream, keep whatever text arrived so far as the final
  // entry (onFinish never fires on an aborted stream), then snap the transcript to the bottom.
  // Also pauses auto mode - a manual cancel shouldn't be immediately overridden by the next auto turn.
  const handleStop = (): void => {
    if (!isLoading) return;
    const speaker = transcript.currentSpeakerRef.current;
    const entryId = transcript.streamingEntryIdRef.current;
    transcript.stoppedRef.current = true;
    stop();
    sequencing.setAutoMode(false);
    if (speaker && completion) {
      transcript.resolveStreamingEntry(speaker, sanitizeSpeech(completion));
    } else if (entryId && transcript.regeneratingEntryIdRef.current === entryId) {
      // Regenerating an existing entry - leave its prior (fallback) text in place instead of
      // deleting the turn it belongs to.
      transcript.clearStreamingState();
    } else if (entryId) {
      // Stopped before any text streamed back - drop the empty placeholder rather than leave it.
      const withoutPlaceholder = transcript.historyRef.current.filter((entry) => entry.id !== entryId);
      transcript.setHistory(withoutPlaceholder);
      transcript.clearStreamingState();
    }
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  };

  // Actually ends the debate, once every party has had its closing statement (or there were none to give).
  const finishDebate = (): void => {
    sequencing.setDebateFinished(true);
    transcript.clearCurrentSpeakerDisplay();
    sequencing.setAutoMode(false);
    sequencing.setIsEndingDebate(false);
    sequencing.clearClosingQueue();
  };

  // "Avsluta" doesn't end the debate outright - it gives every participating party one final
  // closing statement first (in a freshly shuffled order), then finishDebate ends it for real.
  const endDebate = (): void => {
    if (sequencing.debateFinished || sequencing.isEndingDebate) return;
    sequencing.setAutoMode(false);
    sequencing.setIsEndingDebate(true);
    sequencing.setTargetSpeakerId(null);
    const firstSpeakerId = sequencing.startClosingRound(selectedParties.map((party) => party.id));
    if (firstSpeakerId) {
      generateSpeech(firstSpeakerId, "closing");
    } else {
      finishDebate();
    }
  };

  const resetDebate = (): void => {
    setDebateStarted(false);
    setSelectedParties([]);
    setTopic("");
    setUserInterjection("");
    transcript.resetTranscript();
    sequencing.resetSequencing();
  };

  let currentSpeakerParty: PartyPersona | null | undefined;
  if (transcript.currentSpeakerId) {
    currentSpeakerParty = PARTIES.find((candidateParty) => candidateParty.id === transcript.currentSpeakerId);
  } else {
    currentSpeakerParty = null;
  }

  return {
    autoMode: sequencing.autoMode,
    confirmContinueAfterCap,
    currentSpeakerId: transcript.currentSpeakerId,
    currentSpeakerParty,
    debateFinished: sequencing.debateFinished,
    debateStarted,
    dismissTurnCapDialog: sequencing.dismissTurnCapDialog,
    endDebate,
    handleNextSpeaker,
    handleStop,
    handleUserInterjection,
    history: transcript.history,
    isEndingDebate: sequencing.isEndingDebate,
    isLoading,
    pendingText: transcript.pendingText,
    regenerateEntry,
    resetDebate,
    selectedParties,
    setTargetSpeakerId: sequencing.setTargetSpeakerId,
    setTopic,
    setUserInterjection,
    showTurnCapDialog: sequencing.showTurnCapDialog,
    startDebate,
    streamingEntryId: transcript.streamingEntryId,
    targetSpeakerId: sequencing.targetSpeakerId,
    toggleAutoMode,
    toggleParty,
    topic,
    transcriptContainerRef,
    userInterjection,
  };
}
