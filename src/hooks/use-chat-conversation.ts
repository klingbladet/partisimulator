import { useCompletion } from "@ai-sdk/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useRef, useState } from "react";
import { findPrecedingUserEntry, isDuplicateOfLastEntry } from "@/lib/history";
import { buildNoAnswerFallback } from "@/lib/no-answer";
import { getParty } from "@/lib/parties";
import { sanitizeSpeech } from "@/lib/sanitize";
import { cleanText, extractSources, extractStance, type Stance, stripStanceMarker } from "@/lib/sources";
import { MAX_HISTORY_ENTRIES } from "@/lib/validation";
import type { ChatMessage } from "@/types/chat";
import type { PartyPersona } from "@/types/party";

interface UseChatConversationResult {
  chatEndRef: RefObject<HTMLDivElement | null>;
  chatHistory: ChatMessage[];
  error: Error | undefined;
  followUpQuestion: string;
  handleSendQuestion: (textToSend: string) => Promise<void>;
  handleStop: () => void;
  isLoading: boolean;
  pendingStance: Stance | undefined;
  pendingText: string;
  question: string;
  regenerateMessage: (messageId: string) => Promise<void>;
  regeneratingMessageId: string | null;
  selectedParty: PartyPersona | null;
  setFollowUpQuestion: (value: string) => void;
  setQuestion: (value: string) => void;
  setSelectedParty: (party: PartyPersona | null) => void;
}

/** Owns all state and streaming logic for the single-party chat on the home page; the page itself only renders. */
export function useChatConversation(): UseChatConversationResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedParty, setSelectedParty] = useState<PartyPersona | null>(null);
  const [question, setQuestion] = useState("");
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [pendingText, setPendingText] = useState("");
  const [pendingStance, setPendingStance] = useState<Stance | undefined>(undefined);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Set right before a manual stop, so the awaited complete() call in handleSendQuestion (which
  // also settles once the abort resolves) knows not to add its own fallback message on top of
  // whatever handleStop already added for the partial reply.
  const stoppedRef = useRef(false);
  // Id of the failed message currently being regenerated, if any - tells addAssistantMessage /
  // addFallbackMessage (and onFinish, below) to replace that message in place instead of
  // appending a new one. Mirrored into state so the UI can disable/animate its regenerate button.
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const regeneratingMessageIdRef = useRef<string | null>(null);

  // Preselect a party from a landing-page link, and/or seed a full conversation from a
  // "Fortsätt chatta" handoff (e.g. from the grid page), then strip the params.
  // router.replace("/direktfraga") clears them, so the re-run this triggers hits the guard below and no-ops.
  useEffect(() => {
    const partyId = searchParams.get("party");
    if (!partyId) return;

    const party = getParty(partyId);
    if (!party) return;
    setSelectedParty(party);

    const seedQuestion = searchParams.get("q");
    const seedAnswer = searchParams.get("a");
    if (seedQuestion && seedAnswer) {
      setChatHistory([
        { id: crypto.randomUUID(), role: "user", text: seedQuestion },
        { id: crypto.randomUUID(), role: "assistant", text: seedAnswer },
      ]);
    }
    router.replace("/direktfraga");
  }, [router, searchParams]);

  // `targetMessageId` set means this is regenerating a specific failed message - replace it in
  // place instead of appending, and clear whatever error state it was showing.
  const addFallbackMessage = (targetMessageId?: string): void => {
    if (!selectedParty) return;
    const fallback = buildNoAnswerFallback(selectedParty);
    if (targetMessageId) {
      setChatHistory((prev) =>
        prev.map((message) =>
          message.id === targetMessageId
            ? { ...message, isError: true, manifestUrl: fallback.manifestUrl, text: fallback.text }
            : message,
        ),
      );
    } else {
      setChatHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          isError: true,
          manifestUrl: fallback.manifestUrl,
          role: "assistant",
          text: fallback.text,
        },
      ]);
    }
    setPendingText("");
    setPendingStance(undefined);
  };

  const addAssistantMessage = (rawText: string, targetMessageId?: string): void => {
    const sanitized = sanitizeSpeech(rawText);
    const stance = extractStance(sanitized);
    const cleaned = cleanText(stripStanceMarker(sanitized));
    if (!cleaned) {
      // The raw reply sanitized down to nothing (e.g. it was entirely a leaked reasoning
      // preamble) - show the in-character fallback instead of leaving the question unanswered.
      addFallbackMessage(targetMessageId);
      return;
    }
    const sources = extractSources(sanitized);

    if (targetMessageId) {
      setChatHistory((prev) =>
        prev.map((message) =>
          message.id === targetMessageId
            ? { id: message.id, role: "assistant", sources, stance, text: cleaned }
            : message,
        ),
      );
    } else {
      setChatHistory((prev) => {
        // Prevent duplicate entry if both onFinish and complete return
        if (isDuplicateOfLastEntry(prev, (lastEntry) => lastEntry.role === "assistant" && lastEntry.text === cleaned)) {
          return prev;
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            sources,
            stance,
            text: cleaned,
          },
        ];
      });
    }
    setPendingText("");
    setPendingStance(undefined);
  };

  const { completion, complete, isLoading, error, stop } = useCompletion({
    api: "/api/ask",
    onFinish: (_prompt, completionText) => {
      if (completionText) {
        addAssistantMessage(completionText, regeneratingMessageIdRef.current ?? undefined);
      }
    },
    streamProtocol: "text",
  });

  // Abort an in-flight answer when the user navigates away - otherwise the stream keeps running
  // server-side with nothing left to render it.
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    return () => stopRef.current();
  }, []);

  // Stream live text into pendingText, parsing the stance marker out as soon as it's arrived
  // (the regex isn't anchored to the start, so this resolves within the first ~20 characters
  // streamed) instead of only once the whole reply finishes.
  useEffect(() => {
    if (isLoading && completion) {
      const sanitized = sanitizeSpeech(completion);
      setPendingStance(extractStance(sanitized));
      setPendingText(cleanText(stripStanceMarker(sanitized)));
    }
  }, [completion, isLoading]);

  // Auto-scroll to the newest turn, but only when one is added - not on every streamed chunk,
  // so scrolling up to re-read earlier messages during generation isn't fought.
  const chatHistoryLength = chatHistory.length;
  useEffect(() => {
    if (chatHistoryLength > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistoryLength]);

  // Send a question (either initial or follow-up)
  const handleSendQuestion = async (textToSend: string): Promise<void> => {
    if (!selectedParty || !textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    stoppedRef.current = false;
    setQuestion("");
    setFollowUpQuestion("");

    // Add user message to history
    const updatedHistory: ChatMessage[] = [...chatHistory, { id: crypto.randomUUID(), role: "user", text: userText }];
    setChatHistory(updatedHistory);

    // Send to API with recent conversation context, windowed to the server's own cap - a long
    // enough conversation would otherwise eventually exceed askRequestSchema's history limit and
    // start failing every follow-up outright.
    const apiHistory = chatHistory.slice(-MAX_HISTORY_ENTRIES).map((message) => ({
      content: message.text,
      role: message.role,
    }));

    const result = await complete(userText, {
      body: {
        history: apiHistory,
        partyId: selectedParty.id,
        question: userText,
      },
    });

    if (result) {
      addAssistantMessage(result);
    } else if (!stoppedRef.current) {
      addFallbackMessage();
    }
  };

  // Re-runs a failed reply's request and replaces it in place once it settles, rather than
  // appending a new message - the question it answered is the nearest preceding user message.
  const regenerateMessage = async (messageId: string): Promise<void> => {
    if (!selectedParty || isLoading) return;

    const messageIndex = chatHistory.findIndex((message) => message.id === messageId);
    if (messageIndex === -1) return;

    const precedingQuestion = findPrecedingUserEntry(chatHistory, messageIndex);
    if (!precedingQuestion) return;

    stoppedRef.current = false;
    regeneratingMessageIdRef.current = messageId;
    setRegeneratingMessageId(messageId);

    const apiHistory = chatHistory
      .slice(0, precedingQuestion.index)
      .slice(-MAX_HISTORY_ENTRIES)
      .map((message) => ({ content: message.text, role: message.role }));

    const result = await complete(precedingQuestion.text, {
      body: {
        history: apiHistory,
        partyId: selectedParty.id,
        question: precedingQuestion.text,
      },
    });

    if (result) {
      addAssistantMessage(result, messageId);
    } else if (!stoppedRef.current) {
      addFallbackMessage(messageId);
    }
    regeneratingMessageIdRef.current = null;
    setRegeneratingMessageId(null);
  };

  // Cancel a running answer: abort the stream, keep whatever text arrived so far as the final
  // message (onFinish never fires on an aborted stream), then snap the view back to the bottom.
  const handleStop = (): void => {
    if (!isLoading) return;
    stoppedRef.current = true;
    stop();
    const targetMessageId = regeneratingMessageIdRef.current ?? undefined;
    if (completion) {
      addAssistantMessage(completion, targetMessageId);
    }
    regeneratingMessageIdRef.current = null;
    setRegeneratingMessageId(null);
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  return {
    chatEndRef,
    chatHistory,
    error,
    followUpQuestion,
    handleSendQuestion,
    handleStop,
    isLoading,
    pendingStance,
    pendingText,
    question,
    regenerateMessage,
    regeneratingMessageId,
    selectedParty,
    setFollowUpQuestion,
    setQuestion,
    setSelectedParty,
  };
}
