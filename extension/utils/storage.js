const STORAGE_KEYS = {
  BOOKMARKS: "chathop_bookmarks",
  SETTINGS: "chathop_settings",
  HOP_HISTORY: "chathop_hop_history",
  PENDING_HOP: "chathop_pending_hop",
  COMPARE_SESSIONS: "chathop_compare_sessions"
};

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function getBookmarks() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BOOKMARKS);
  return result[STORAGE_KEYS.BOOKMARKS] || [];
}

async function saveBookmark(conversation) {
  const bookmarks = await getBookmarks();
  const bookmark = {
    id: generateId(),
    ...conversation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  bookmarks.unshift(bookmark);
  await chrome.storage.local.set({ [STORAGE_KEYS.BOOKMARKS]: bookmarks });
  return bookmark;
}

async function deleteBookmark(id) {
  const bookmarks = await getBookmarks();
  const next = bookmarks.filter((bookmark) => bookmark.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEYS.BOOKMARKS]: next });
}

async function updateBookmark(id, updates) {
  const bookmarks = await getBookmarks();
  const index = bookmarks.findIndex((bookmark) => bookmark.id === id);

  if (index === -1) {
    return;
  }

  bookmarks[index] = {
    ...bookmarks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await chrome.storage.local.set({ [STORAGE_KEYS.BOOKMARKS]: bookmarks });
}

async function searchBookmarks(query) {
  const bookmarks = await getBookmarks();
  const q = query.trim().toLowerCase();

  if (!q) {
    return bookmarks;
  }

  return bookmarks.filter((bookmark) => {
    const title = (bookmark.title || "").toLowerCase();
    const tags = (bookmark.tags || []).join(" ").toLowerCase();
    const customTags = (bookmark.customTags || []).join(" ").toLowerCase();
    const messages = (bookmark.messages || []).some((message) =>
      (message.content || "").toLowerCase().includes(q)
    );

    return title.includes(q) || tags.includes(q) || customTags.includes(q) || messages;
  });
}

async function logHop(fromPlatform, toPlatform, mode) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.HOP_HISTORY);
  const hopHistory = result[STORAGE_KEYS.HOP_HISTORY] || [];

  hopHistory.push({
    from: fromPlatform,
    to: toPlatform,
    mode,
    timestamp: new Date().toISOString()
  });

  await chrome.storage.local.set({ [STORAGE_KEYS.HOP_HISTORY]: hopHistory });
}

async function setPendingHop(pendingHop) {
  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_HOP]: pendingHop });
}

async function getPendingHop() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_HOP);
  return result[STORAGE_KEYS.PENDING_HOP] || null;
}

async function clearPendingHop() {
  await chrome.storage.local.remove(STORAGE_KEYS.PENDING_HOP);
}

async function createCompareSession(session) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.COMPARE_SESSIONS);
  const sessions = result[STORAGE_KEYS.COMPARE_SESSIONS] || [];

  const record = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    winnerPlatform: null,
    ...session
  };

  sessions.unshift(record);
  await chrome.storage.local.set({ [STORAGE_KEYS.COMPARE_SESSIONS]: sessions.slice(0, 500) });
  return record;
}

async function getCompareSessions() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.COMPARE_SESSIONS);
  return result[STORAGE_KEYS.COMPARE_SESSIONS] || [];
}

async function recordCompareResult(sessionId, winnerPlatform) {
  const sessions = await getCompareSessions();
  const index = sessions.findIndex((session) => session.id === sessionId);

  if (index === -1) {
    return null;
  }

  sessions[index] = {
    ...sessions[index],
    winnerPlatform,
    resolvedAt: new Date().toISOString()
  };

  await chrome.storage.local.set({ [STORAGE_KEYS.COMPARE_SESSIONS]: sessions });
  return sessions[index];
}

async function getRoutingInsights() {
  const compareSessions = await getCompareSessions();
  const winnerCounts = {};

  for (const session of compareSessions) {
    if (!session.winnerPlatform) {
      continue;
    }

    winnerCounts[session.winnerPlatform] = (winnerCounts[session.winnerPlatform] || 0) + 1;
  }

  return {
    winnerCounts,
    totalResolvedComparisons: compareSessions.filter((session) => Boolean(session.winnerPlatform)).length
  };
}
