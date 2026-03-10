import type { Bookmark } from "./types";

export async function getBookmarks(): Promise<Bookmark[]> {
  if (!window.chrome?.runtime?.sendMessage) {
    return [];
  }

  const response = await window.chrome.runtime.sendMessage({ action: "GET_BOOKMARKS" });
  return response?.bookmarks || [];
}

export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  if (!window.chrome?.runtime?.sendMessage) {
    return [];
  }

  const response = await window.chrome.runtime.sendMessage({
    action: "SEARCH_BOOKMARKS",
    data: { query }
  });

  return response?.results || [];
}

export type HopEvent = {
  from: string;
  to: string;
  mode: string;
  timestamp: string;
};

export async function getHopHistory(): Promise<HopEvent[]> {
  if (!window.chrome?.runtime?.sendMessage) {
    return [];
  }

  const response = await window.chrome.runtime.sendMessage({ action: "GET_HOP_HISTORY" });
  return response?.history || [];
}

export type CompareSession = {
  id: string;
  fromPlatform: string;
  primaryPlatform: string;
  secondaryPlatform: string;
  mode: string;
  title: string;
  winnerPlatform: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export async function getCompareSessions(): Promise<CompareSession[]> {
  if (!window.chrome?.runtime?.sendMessage) {
    return [];
  }

  const response = await window.chrome.runtime.sendMessage({ action: "GET_COMPARE_SESSIONS" });
  return response?.sessions || [];
}

export async function recordCompareResult(sessionId: string, winnerPlatform: string): Promise<boolean> {
  if (!window.chrome?.runtime?.sendMessage) {
    return false;
  }

  const response = await window.chrome.runtime.sendMessage({
    action: "RECORD_COMPARE_RESULT",
    data: { sessionId, winnerPlatform }
  });

  return Boolean(response?.success);
}
