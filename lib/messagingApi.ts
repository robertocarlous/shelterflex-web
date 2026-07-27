import { apiGet, apiPost, withQuery } from "./apiClient";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type MessageAttachment = {
  type: "image" | "document";
  name: string;
};

export type Message = {
  id: number;
  senderId: "me" | "other";
  text: string;
  timestamp: string;
  status: MessageStatus;
  attachment?: MessageAttachment;
};

export type ConversationParticipant = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
};

export type Conversation = {
  id: number;
  participant: ConversationParticipant;
  property: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
};

export type PaginatedMessages = {
  items: Message[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type ConversationsResponse = {
  items: Conversation[];
  total: number;
};

export async function fetchConversations(params?: {
  search?: string;
  limit?: number;
  cursor?: number;
}): Promise<ConversationsResponse> {
  return apiGet<ConversationsResponse>(
    withQuery("/messages/conversations", {
      search: params?.search,
      limit: params?.limit ?? 50,
      cursor: params?.cursor,
    })
  );
}

export async function fetchConversationMessages(
  conversationId: number,
  params?: {
    limit?: number;
    cursor?: number;
  }
): Promise<PaginatedMessages> {
  return apiGet<PaginatedMessages>(
    withQuery(`/messages/conversations/${conversationId}/messages`, {
      limit: params?.limit ?? 20,
      cursor: params?.cursor,
    })
  );
}

export async function sendMessage(
  conversationId: number,
  text: string
): Promise<{ success: boolean; data: Message }> {
  return apiPost<{ success: boolean; data: Message }>(
    `/messages/conversations/${conversationId}/messages`,
    { text }
  );
}

export async function markConversationRead(
  conversationId: number
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    `/messages/conversations/${conversationId}/read`,
    {}
  );
}
