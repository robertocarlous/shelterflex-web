"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage as apiSendMessage,
  type Conversation,
  type Message,
} from "@/lib/messagingApi";

const MESSAGES_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export type UseMessagingReturn = {
  conversations: Conversation[];
  isLoadingConversations: boolean;
  conversationsError: Error | null;
  refetchConversations: () => void;
  selectedConversationId: number | null;
  selectConversation: (id: number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  messages: Message[];
  isLoadingMessages: boolean;
  messagesError: Error | null;
  refetchMessages: () => void;
  hasMoreMessages: boolean;
  loadOlderMessages: () => Promise<void>;
  isLoadingOlder: boolean;
  sendMessage: (text: string) => Promise<boolean>;
  retryMessage: (messageId: number) => Promise<boolean>;
  isSending: boolean;
  drafts: Record<number, string>;
  setDraft: (conversationId: number, text: string) => void;
  getDraft: (conversationId: number) => string;
};

export function useMessaging(): UseMessagingReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState<Error | null>(null);

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<Error | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const messagesRef = useRef<Message[]>([]);
  const cursorRef = useRef<number | null>(null);

  messagesRef.current = messages;

  const fetchConversationsData = useCallback(async (query?: string) => {
    setIsLoadingConversations(true);
    setConversationsError(null);

    try {
      const data = await fetchConversations({
        search: query || undefined,
        limit: 50,
      });
      setConversations(data.items || []);
    } catch (error) {
      setConversationsError(error instanceof Error ? error : new Error("Failed to fetch conversations"));
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const fetchMessagesData = useCallback(async (conversationId: number, cursor?: number) => {
    if (cursor) {
      setIsLoadingOlder(true);
    } else {
      setIsLoadingMessages(true);
      setMessagesError(null);
    }

    try {
      const data = await fetchConversationMessages(conversationId, {
        limit: MESSAGES_PAGE_SIZE,
        cursor,
      });

      const newMessages = data.items || [];
      const nextCursor = data.nextCursor || null;

      if (cursor) {
        setMessages(prev => [...newMessages, ...prev]);
        cursorRef.current = nextCursor;
      } else {
        setMessages(newMessages);
        cursorRef.current = nextCursor;
      }

      setHasMoreMessages(!!nextCursor);
    } catch (error) {
      setMessagesError(error instanceof Error ? error : new Error("Failed to fetch messages"));
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingOlder(false);
    }
  }, []);

  useEffect(() => {
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    fetchConversationsData(debouncedSearchQuery || undefined);
  }, [debouncedSearchQuery, fetchConversationsData]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      cursorRef.current = null;
      setHasMoreMessages(false);
      return;
    }

    cursorRef.current = null;
    fetchMessagesData(selectedConversationId);
  }, [selectedConversationId, fetchMessagesData]);

  const selectConversation = useCallback((id: number | null) => {
    setSelectedConversationId(id);
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!selectedConversationId || !cursorRef.current || isLoadingOlder) {
      return;
    }

    await fetchMessagesData(selectedConversationId, cursorRef.current);
  }, [selectedConversationId, fetchMessagesData, isLoadingOlder]);

  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedConversationId || !text.trim() || isSending) {
      return false;
    }

    const optimisticMsg: Message = {
      id: Date.now(),
      senderId: "me",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sending",
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setIsSending(true);

    try {
      const data = await apiSendMessage(selectedConversationId, text.trim());
      setMessages(prev =>
        prev.map(m =>
          m.id === optimisticMsg.id
            ? { ...m, status: "sent" as const, id: data.data?.id || m.id }
            : m
        )
      );
      return true;
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === optimisticMsg.id ? { ...m, status: "failed" as const } : m
        )
      );
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedConversationId, isSending]);

  const retryMessage = useCallback(async (messageId: number): Promise<boolean> => {
    if (!selectedConversationId || isSending) {
      return false;
    }

    const message = messagesRef.current.find(m => m.id === messageId);
    if (!message) return false;

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, status: "sending" as const } : m
      )
    );
    setIsSending(true);

    try {
      await apiSendMessage(selectedConversationId, message.text);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, status: "sent" as const } : m
        )
      );
      return true;
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, status: "failed" as const } : m
        )
      );
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedConversationId, isSending]);

  const setDraft = useCallback((conversationId: number, text: string) => {
    setDrafts(prev => ({ ...prev, [conversationId]: text }));
  }, []);

  const getDraft = useCallback((conversationId: number): string => {
    return drafts[conversationId] || "";
  }, [drafts]);

  const refetchConversations = useCallback(() => {
    fetchConversationsData(debouncedSearchQuery || undefined);
  }, [fetchConversationsData, debouncedSearchQuery]);

  const refetchMessages = useCallback(() => {
    if (selectedConversationId) {
      cursorRef.current = null;
      fetchMessagesData(selectedConversationId);
    }
  }, [selectedConversationId, fetchMessagesData]);

  return {
    conversations,
    isLoadingConversations,
    conversationsError,
    refetchConversations,
    selectedConversationId,
    selectConversation,
    searchQuery,
    setSearchQuery,
    isSearching,
    messages,
    isLoadingMessages,
    messagesError,
    refetchMessages,
    hasMoreMessages,
    loadOlderMessages,
    isLoadingOlder,
    sendMessage,
    retryMessage,
    isSending,
    drafts,
    setDraft,
    getDraft,
  };
}
