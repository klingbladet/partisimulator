import { useCompletion } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { type RefObject, useEffect, useRef, useState } from "react";
import { isDuplicateOfLastEntry } from "@/lib/history";
import { cleanText, extractSources } from "@/lib/sources";
import type { ChatMessage } from "@/types/chat";
import type { PartyPersona } from "@/types/party";

interface UseChatConversationResult {
  chatEndRef: RefObject<HTMLDivElement | null>;
  chatHistory: ChatMessage[];
  error: Error | undefined;
  followUpQuestion: string;
  handleAllParties: () => void;
  handleResetConversation: () => void;
  handleSendQuestion: (textToSend: string) => Promise<void>;
  isLoading: boolean;
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
  const [selectedParty, setSelectedParty] = useState<PartyPersona | null>(null);
  const [question, setQuestion] = useState("");
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [pendingText, setPendingText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addAssistantMessage = (rawText: string): void => {
    const cleaned = cleanText(rawText);
    if (!cleaned) return;
    const sources = extractSources(rawText);

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
          text: cleaned,
        },
      ];
    });
    setPendingText("");
  };

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/ask",
    onFinish: (_prompt, completionText) => {
      if (completionText) {
        addAssistantMessage(completionText);
      }
    },
    streamProtocol: "text",
  });

  // Stream live text into pendingText
  useEffect(() => {
    if (isLoading && completion) {
      setPendingText(cleanText(completion));
    }
  }, [completion, isLoading]);

  // Auto-scroll chat to bottom, but only once there's something to scroll to
  useEffect(() => {
    if (chatHistory.length > 0 || pendingText) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, pendingText]);

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

  const handleAllParties = (): void => {
    if (!question.trim()) return;
    router.push(`/grid?q=${encodeURIComponent(question)}`);
  };

  const handleResetConversation = (): void => {
    setChatHistory([]);
    setPendingText("");
    setQuestion("");
    setFollowUpQuestion("");
  };

  return {
    chatEndRef,
    chatHistory,
    error,
    followUpQuestion,
    handleAllParties,
    handleResetConversation,
    handleSendQuestion,
    isLoading,
    pendingText,
    question,
    selectedParty,
    setFollowUpQuestion,
    setQuestion,
    setSelectedParty,
  };
}
