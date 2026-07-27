import { render, screen, fireEvent } from "@testing-library/react";
import MessagesPage from "./page";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const mockSelectConversation = vi.fn();
const mockSendMessage = vi.fn();
const mockRetryMessage = vi.fn();
const mockLoadOlderMessages = vi.fn();
const mockSetSearchQuery = vi.fn();

let draftStore: Record<number, string> = {};
const mockSetDraft = vi.fn((id: number, text: string) => {
  draftStore[id] = text;
});
const mockGetDraft = vi.fn((id: number) => draftStore[id] || "");

vi.mock("@/store/useAuthStore", () => ({
  default: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock("@/hooks/useMessaging", () => ({
  useMessaging: () => ({
    conversations: [
      {
        id: 1,
        participant: {
          id: "user-1",
          name: "Adebayo Johnson",
          role: "Whistleblower",
          avatar: "AJ",
          online: true,
        },
        property: "Modern 3 Bedroom Flat",
        lastMessage: "Great property! You'll love the neighborhood",
        timestamp: "2 min ago",
        unread: 2,
      },
      {
        id: 2,
        participant: {
          id: "user-2",
          name: "Mrs. Adeleke",
          role: "Landlord",
          avatar: "MA",
          online: false,
        },
        property: "Modern 2 Bedroom Flat",
        lastMessage: "The maintenance has been completed",
        timestamp: "1 hour ago",
        unread: 0,
      },
    ],
    isLoadingConversations: false,
    conversationsError: null,
    selectedConversationId: 1,
    selectConversation: mockSelectConversation,
    searchQuery: "",
    setSearchQuery: mockSetSearchQuery,
    isSearching: false,
    messages: [
      {
        id: 1,
        senderId: "me",
        text: "Hi Adebayo, is the apartment still available?",
        timestamp: "2:30 PM",
        status: "read",
      },
      {
        id: 2,
        senderId: "other",
        text: "Yes! It's still available. Would you like to schedule a viewing?",
        timestamp: "2:32 PM",
        status: "read",
      },
    ],
    isLoadingMessages: false,
    messagesError: null,
    hasMoreMessages: true,
    loadOlderMessages: mockLoadOlderMessages,
    isLoadingOlder: false,
    sendMessage: mockSendMessage,
    retryMessage: mockRetryMessage,
    isSending: false,
    drafts: draftStore,
    setDraft: mockSetDraft,
    getDraft: mockGetDraft,
  }),
}));

window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("MessagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftStore = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls setDraft when typing a message", () => {
    render(<MessagesPage />);

    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: "Draft for conversation 1" } });

    expect(mockSetDraft).toHaveBeenCalledWith(1, "Draft for conversation 1");
  });

  it("calls selectConversation with null on back button click", () => {
    render(<MessagesPage />);

    expect(screen.getByText(/Adebayo Johnson/i, { selector: "h2" })).toBeInTheDocument();

    const backButton = screen.getByLabelText("Back to conversations");
    fireEvent.click(backButton);

    expect(mockSelectConversation).toHaveBeenCalledWith(null);
  });

  it("disables send button when message input is empty", () => {
    render(<MessagesPage />);

    const sendBtn = screen.getByLabelText("Send message");
    expect(sendBtn).toBeDisabled();
  });

  it("enables send button when there is text in the draft", () => {
    draftStore[1] = "Hello from draft";
    render(<MessagesPage />);

    const sendBtn = screen.getByLabelText("Send message");
    expect(sendBtn).not.toBeDisabled();
  });

  it("has accessible message thread region", () => {
    render(<MessagesPage />);

    const log = screen.getByRole("log");
    expect(log).toBeInTheDocument();
    expect(log).toHaveAttribute("aria-live", "polite");
  });

  it("renders conversation messages from mock data", () => {
    render(<MessagesPage />);

    expect(screen.getByText("Hi Adebayo, is the apartment still available?")).toBeInTheDocument();
    expect(screen.getByText(/Yes! It's still available/)).toBeInTheDocument();
  });

  it("calls setSearchQuery when typing in search input", () => {
    render(<MessagesPage />);

    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    fireEvent.change(searchInput, { target: { value: "test" } });

    expect(mockSetSearchQuery).toHaveBeenCalledWith("test");
  });
});
