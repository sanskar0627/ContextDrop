export type Platform = "chatgpt" | "claude" | "gemini" | "perplexity" | "grok";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Bookmark {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  messages: ChatMessage[];
  messageCount: number;
  wordCount: number;
  tags: string[];
  customTags: string[];
  createdAt: string;
}
