import { type RefObject, useCallback, useRef, useState } from "react";
import { shuffleArray } from "@/lib/shuffle";
import type { PartyId, PartyPersona } from "@/types/party";

// Caps how many turns auto mode will chain through unattended before pausing itself; manual
// stepping via "Nästa replik" is never capped.
export const AUTO_MODE_TURN_CAP = 20;

// "opening" gets the debate's welcome announcement; "targeted" skips the moderator line entirely
// since the interjection that picked this speaker already named them; "closing" gets each party's
// final-statement announcement instead of the regular "next up" one.
export type TurnKind = "closing" | "opening" | "regular" | "targeted";

export interface NextTurnPick {
  speakerId: string;
  isTargeted: boolean;
}

export type NextTurnDecision =
  | { type: "speak"; speakerId: string; turnKind: TurnKind }
  | { type: "finishClosing" }
  | { type: "none" };

interface UseDebateSequencingParams {
  selectedParties: PartyPersona[];
  // Owned by the transcript hook - lets sequencing avoid opening a fresh queue with whoever just
  // closed the previous round, without transcript and sequencing needing to know about each other.
  lastSpeakerIdRef: RefObject<string | null>;
}

interface UseDebateSequencingResult {
  autoMode: boolean;
  targetSpeakerId: string | null;
  isEndingDebate: boolean;
  showTurnCapDialog: boolean;
  debateFinished: boolean;
  setAutoMode: (value: boolean) => void;
  setTargetSpeakerId: (partyId: string | null) => void;
  setIsEndingDebate: (value: boolean) => void;
  setDebateFinished: (value: boolean) => void;
  resetTurnCount: () => void;
  clearClosingQueue: () => void;
  pickNextSpeaker: () => NextTurnPick | undefined;
  decideNextTurn: (turnKind: TurnKind) => NextTurnDecision;
  confirmContinueAfterCap: () => NextTurnPick | undefined;
  dismissTurnCapDialog: () => void;
  startClosingRound: (partyIds: string[]) => string | undefined;
  startNewDebateRound: () => void;
  markDebateFinishedOnUnmount: () => void;
  resetSequencing: () => void;
}

/** Owns turn sequencing: whose turn is next, auto mode's chain and turn cap, and the closing round. */
export function useDebateSequencing(params: UseDebateSequencingParams): UseDebateSequencingResult {
  const [autoMode, setAutoModeState] = useState(false);
  const autoModeRef = useRef(false);
  // Lets the moderator aim a question at a specific party instead of whoever's next in the shuffle
  // queue; cleared once it's used so it never lingers onto a later, unrelated question.
  const [targetSpeakerId, setTargetSpeakerIdState] = useState<string | null>(null);
  const targetSpeakerIdRef = useRef<string | null>(null);
  // True from the moment "Avsluta" is confirmed until every party has given its closing statement -
  // gates the other controls so nothing else can interleave a turn into the closing round.
  const [isEndingDebate, setIsEndingDebateState] = useState(false);
  const isEndingDebateRef = useRef(false);
  // True while the auto-mode turn-cap confirm dialog is open, waiting on the user's choice.
  const [showTurnCapDialog, setShowTurnCapDialog] = useState(false);
  const [debateFinished, setDebateFinishedState] = useState(false);
  const debateFinishedRef = useRef(false);
  const autoModeSpeakerQueueRef = useRef<string[]>([]);
  // Remaining speakers still owed a closing statement, once "Avsluta" has been confirmed.
  const closingQueueRef = useRef<string[] | null>(null);
  const turnCountRef = useRef(0);

  const setAutoMode = (value: boolean): void => {
    autoModeRef.current = value;
    setAutoModeState(value);
  };

  const setTargetSpeakerId = (partyId: string | null): void => {
    targetSpeakerIdRef.current = partyId;
    setTargetSpeakerIdState(partyId);
  };

  const setIsEndingDebate = (value: boolean): void => {
    isEndingDebateRef.current = value;
    setIsEndingDebateState(value);
  };

  const setDebateFinished = (value: boolean): void => {
    debateFinishedRef.current = value;
    setDebateFinishedState(value);
  };

  const resetTurnCount = (): void => {
    turnCountRef.current = 0;
  };

  const clearClosingQueue = (): void => {
    closingQueueRef.current = null;
  };

  // Shuffles a fresh speaking-order queue if the current one is empty, then pops the next speaker.
  // Swaps the new queue's opening speaker if it would repeat the previous round's closing speaker.
  const takeNextAutoSpeaker = (lastSpeakerId: string | null): string | undefined => {
    if (autoModeSpeakerQueueRef.current.length === 0) {
      const shuffled = shuffleArray(params.selectedParties.map((party) => party.id));
      if (shuffled.length > 1 && shuffled[0] === lastSpeakerId) {
        [shuffled[0], shuffled[1]] = [shuffled[1] as PartyId, shuffled[0] as PartyId];
      }
      autoModeSpeakerQueueRef.current = shuffled;
    }
    return autoModeSpeakerQueueRef.current.shift();
  };

  // Every "who speaks next" decision goes through here, so a party targeted via the interjection
  // picker is honored whenever a turn actually opens up - including a turn that opens up later
  // (auto mode's own chain, or the next manual "Nästa talare" click), not just one starting right
  // this instant. Reads/clears the ref directly rather than waiting on the setState + re-render,
  // since a chained call can run again before React commits that update. `isTargeted` tells the
  // caller to skip its own "Turen går till" announcement, since the interjection that targeted this
  // party already addressed them by name.
  const pickNextSpeaker = (): NextTurnPick | undefined => {
    const requestedSpeakerId = targetSpeakerIdRef.current;
    if (requestedSpeakerId) {
      setTargetSpeakerId(null);
      return { isTargeted: true, speakerId: requestedSpeakerId };
    }
    const speakerId = takeNextAutoSpeaker(params.lastSpeakerIdRef.current);
    return speakerId ? { isTargeted: false, speakerId } : undefined;
  };

  // Closing round: chain straight into the next party still owed a statement, in the order fixed
  // when "Avsluta" was confirmed - once the queue is empty, the debate actually ends.
  const decideClosingTurn = (): NextTurnDecision => {
    if (debateFinishedRef.current) return { type: "none" };
    const nextClosingSpeakerId = closingQueueRef.current?.shift();
    if (nextClosingSpeakerId) {
      return { speakerId: nextClosingSpeakerId, turnKind: "closing", type: "speak" };
    }
    return { type: "finishClosing" };
  };

  // Auto mode: chain straight into the next speaker once this reply is done.
  const decideAutoModeTurn = (): NextTurnDecision => {
    turnCountRef.current += 1;
    if (turnCountRef.current >= AUTO_MODE_TURN_CAP) {
      // Hit the auto-mode ceiling: pause and let the user decide whether to keep going, rather than
      // silently ending the debate or running away unattended forever.
      setAutoMode(false);
      setShowTurnCapDialog(true);
      return { type: "none" };
    }
    const nextSpeaker = pickNextSpeaker();
    if (!nextSpeaker) return { type: "none" };
    return {
      speakerId: nextSpeaker.speakerId,
      turnKind: nextSpeaker.isTargeted ? "targeted" : "regular",
      type: "speak",
    };
  };

  // Manual mode (no auto-chain to pick this up on its own), but a party was targeted while this
  // turn was still in flight - answer it now instead of leaving the debate silently paused until
  // an extra "Nästa talare" click.
  const decideTargetedManualTurn = (): NextTurnDecision => {
    if (!targetSpeakerIdRef.current || debateFinishedRef.current || isEndingDebateRef.current) {
      return { type: "none" };
    }
    const nextSpeaker = pickNextSpeaker();
    return nextSpeaker ? { speakerId: nextSpeaker.speakerId, turnKind: "targeted", type: "speak" } : { type: "none" };
  };

  // Once a turn has settled, decides whether - and how - the next one starts: a closing round
  // takes priority, then auto mode's own chain, then a manual-mode party that got targeted while
  // this turn was still in flight. Manual turns (autoMode off) never touch turnCountRef, so
  // stepping through "Nästa replik" by hand is never capped. Returns a plain decision rather than
  // starting the turn itself, since starting a turn is the orchestrator's job (it owns the API call).
  const decideNextTurn = (turnKind: TurnKind): NextTurnDecision => {
    if (turnKind === "closing") return decideClosingTurn();
    if (autoModeRef.current && !debateFinishedRef.current) return decideAutoModeTurn();
    return decideTargetedManualTurn();
  };

  // Confirms the turn-cap dialog: gives auto mode a fresh cap and picks the next speaker to resume with.
  const confirmContinueAfterCap = (): NextTurnPick | undefined => {
    setShowTurnCapDialog(false);
    if (debateFinishedRef.current) return undefined;
    turnCountRef.current = 0;
    setAutoMode(true);
    return pickNextSpeaker();
  };

  // Declines the turn-cap dialog: auto mode stays paused, same as today.
  const dismissTurnCapDialog = (): void => {
    setShowTurnCapDialog(false);
  };

  const startClosingRound = (partyIds: string[]): string | undefined => {
    const closingOrder = shuffleArray(partyIds);
    const firstSpeakerId = closingOrder.shift();
    closingQueueRef.current = closingOrder;
    return firstSpeakerId;
  };

  const startNewDebateRound = (): void => {
    setDebateFinished(false);
    setAutoMode(false);
    autoModeSpeakerQueueRef.current = [];
    turnCountRef.current = 0;
  };

  // Aborting the current fetch alone doesn't stop auto mode's chain, since the recursive call that
  // kicks off the *next* speaker runs after the fetch settles regardless of why it settled, and only
  // checks this ref, never the fact that the hook unmounted. Ref-only (no setState) since a
  // re-render for an unmounting component is pointless.
  // Stable identity (empty deps - only touches a ref) so the orchestrator's mount-once unmount
  // effect can list it as a dependency without re-running on every render.
  const markDebateFinishedOnUnmount = useCallback((): void => {
    debateFinishedRef.current = true;
  }, []);

  const resetSequencing = (): void => {
    setAutoMode(false);
    setIsEndingDebate(false);
    setShowTurnCapDialog(false);
    setDebateFinished(false);
    setTargetSpeakerId(null);
    closingQueueRef.current = null;
    autoModeSpeakerQueueRef.current = [];
    turnCountRef.current = 0;
  };

  return {
    autoMode,
    clearClosingQueue,
    confirmContinueAfterCap,
    debateFinished,
    decideNextTurn,
    dismissTurnCapDialog,
    isEndingDebate,
    markDebateFinishedOnUnmount,
    pickNextSpeaker,
    resetSequencing,
    resetTurnCount,
    setAutoMode,
    setDebateFinished,
    setIsEndingDebate,
    setTargetSpeakerId,
    showTurnCapDialog,
    startClosingRound,
    startNewDebateRound,
    targetSpeakerId,
  };
}
