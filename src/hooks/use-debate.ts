import { useCompletion } from "@ai-sdk/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { isDuplicateOfLastEntry } from "@/lib/history";
import { PARTIES } from "@/lib/parties";
import { cleanText, extractSources } from "@/lib/sources";
import type { DebateEntry } from "@/types/debate";
import type { PartyPersona } from "@/types/party";

const MODERATOR_NAME = "Du (Debattledare)";

interface UseDebateResult {
  currentSpeakerId: string | null;
  currentSpeakerParty: PartyPersona | null | undefined;
  debateFinished: boolean;
  debateStarted: boolean;
  endDebate: () => void;
  handleSelectSpeaker: (partyId: string) => Promise<void>;
  handleUserInterjection: () => void;
  history: DebateEntry[];
  isLoading: boolean;
  pendingText: string;
  resetDebate: () => void;
  selectedParties: PartyPersona[];
  setTopic: (topic: string) => void;
  setUserInterjection: (value: string) => void;
  startDebate: () => void;
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

  const addSpeechToHistory = (speakerId: string, rawText: string): void => {
    const party = PARTIES.find((candidateParty) => candidateParty.id === speakerId);
    const cleaned = cleanText(rawText);
    if (!party || !cleaned) return;

    const sources = extractSources(rawText);
    setHistory((prev) => {
      // Prevent duplicate additions if both onFinish and complete return
      if (
        isDuplicateOfLastEntry(prev, (lastEntry) => lastEntry.speakerId === speakerId && lastEntry.text === cleaned)
      ) {
        return prev;
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          sources,
          speakerId,
          speakerName: party.displayName,
          text: cleaned,
        },
      ];
    });
    setPendingText("");
    setCurrentSpeakerId(null);
    currentSpeakerRef.current = null;
  };

  const { completion, complete, isLoading } = useCompletion({
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

  // Auto-scroll ONLY inside the chat container so politicians remain visible on screen
  useEffect(() => {
    if ((history.length > 0 || pendingText) && transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [history, pendingText]);

  const toggleParty = (party: PartyPersona): void => {
    setSelectedParties((prev) => {
      const isAlreadySelected = prev.find((selectedParty) => selectedParty.id === party.id);
      if (isAlreadySelected) {
        return prev.filter((selectedParty) => selectedParty.id !== party.id);
      }
      return [...prev, party];
    });
  };

  const startDebate = (): void => {
    if (selectedParties.length < 2 || !topic.trim()) return;
    setDebateStarted(true);
    setHistory([]);
    setDebateFinished(false);
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
    setHistory((prev) => [...prev, userEntry]);
    setUserInterjection("");
  };

  const handleSelectSpeaker = async (partyId: string): Promise<void> => {
    if (isLoading || debateFinished) return;
    const party = PARTIES.find((candidateParty) => candidateParty.id === partyId);
    if (!party) return;

    let currentHistory = history;
    if (userInterjection.trim()) {
      const userEntry: DebateEntry = {
        id: crypto.randomUUID(),
        sources: [],
        speakerId: "user",
        speakerName: MODERATOR_NAME,
        text: userInterjection.trim(),
      };
      currentHistory = [...history, userEntry];
      setHistory(currentHistory);
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
      addSpeechToHistory(partyId, finalResult);
    }
  };

  const endDebate = (): void => {
    setDebateFinished(true);
    setCurrentSpeakerId(null);
  };

  const resetDebate = (): void => {
    setDebateStarted(false);
    setDebateFinished(false);
    setHistory([]);
    setSelectedParties([]);
    setTopic("");
    setCurrentSpeakerId(null);
    setPendingText("");
    setUserInterjection("");
  };

  let currentSpeakerParty: PartyPersona | null | undefined;
  if (currentSpeakerId) {
    currentSpeakerParty = PARTIES.find((candidateParty) => candidateParty.id === currentSpeakerId);
  } else {
    currentSpeakerParty = null;
  }

  return {
    currentSpeakerId,
    currentSpeakerParty,
    debateFinished,
    debateStarted,
    endDebate,
    handleSelectSpeaker,
    handleUserInterjection,
    history,
    isLoading,
    pendingText,
    resetDebate,
    selectedParties,
    setTopic,
    setUserInterjection,
    startDebate,
    toggleParty,
    topic,
    transcriptContainerRef,
    userInterjection,
  };
}
