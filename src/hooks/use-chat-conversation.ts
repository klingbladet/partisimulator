import { useCompletion } from "@ai-sdk/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useRef, useState } from "react";
import { isDuplicateOfLastEntry } from "@/lib/history";
import { getParty } from "@/lib/parties";
import { sanitizeSpeech } from "@/lib/sanitize";
import { cleanText, extractSources, extractStance, type Stance, stripStanceMarker } from "@/lib/sources";
import type { ChatMessage } from "@/types/chat";
import type { PartyPersona } from "@/types/party";

interface UseChatConversationResult {
  chatEndRef: RefObject<HTMLDivElement | null>;
  chatHistory: ChatMessage[];
  error: Error | undefined;
  followUpQuestion: string;
  handleResetConversation: () => void;
  handleSendQuestion: (textToSend: string) => Promise<void>;
  handleStop: () => void;
  isLoading: boolean;
  pendingStance: Stance | undefined;
  pendingText: string;
  question: string;
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

  // Seed the conversation from a "Fortsätt chatta" handoff (e.g. from the grid page), then strip the params.
  // router.replace("/") clears party/q/a, so the re-run this triggers hits the guard below and no-ops.
  useEffect(() => {
    const partyId = searchParams.get("party");
    const seedQuestion = searchParams.get("q");
    const seedAnswer = searchParams.get("a");
    if (!partyId || !seedQuestion || !seedAnswer) return;

    const party = getParty(partyId);
    if (!party) return;

    setSelectedParty(party);
    setChatHistory([
      { id: crypto.randomUUID(), role: "user", text: seedQuestion },
      { id: crypto.randomUUID(), role: "assistant", text: seedAnswer },
    ]);
    router.replace("/");
  }, [router, searchParams]);

  const addAssistantMessage = (rawText: string): void => {
    const sanitized = sanitizeSpeech(rawText);
    const stance = extractStance(sanitized);
    const cleaned = cleanText(stripStanceMarker(sanitized));
    if (!cleaned) return;
    const sources = extractSources(sanitized);

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
    setPendingText("");
    setPendingStance(undefined);
  };

  const { completion, complete, isLoading, error, stop } = useCompletion({
    api: "/api/ask",
    onFinish: (_prompt, completionText) => {
      if (completionText) {
        addAssistantMessage(completionText);
      }
    },
    streamProtocol: "text",
  });

  // Abort an in-flight answer when the user navigates away — otherwise the stream keeps running
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

  // Auto-scroll to the newest turn, but only when one is added — not on every streamed chunk,
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
    setQuestion("");
    setFollowUpQuestion("");

    // Add user message to history
    const updatedHistory: ChatMessage[] = [...chatHistory, { id: crypto.randomUUID(), role: "user", text: userText }];
    setChatHistory(updatedHistory);

    // Send to API with full conversation context
    const apiHistory = chatHistory.map((message) => ({
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
    }
  };

  // Cancel a running answer: abort the stream, keep whatever text arrived so far as the final
  // message (onFinish never fires on an aborted stream), then snap the view back to the bottom.
  const handleStop = (): void => {
    if (!isLoading) return;
    stop();
    if (completion) {
      addAssistantMessage(completion);
    }
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const handleResetConversation = (): void => {
    setChatHistory([]);
    setPendingText("");
    setPendingStance(undefined);
    setQuestion("");
    setFollowUpQuestion("");
  };

  return {
    chatEndRef,
    chatHistory,
    error,
    followUpQuestion,
    handleResetConversation,
    handleSendQuestion,
    handleStop,
    isLoading,
    pendingStance,
    pendingText,
    question,
    selectedParty,
    setFollowUpQuestion,
    setQuestion,
    setSelectedParty,
  };
}
