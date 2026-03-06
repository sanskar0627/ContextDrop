importScripts("../utils/storage.js", "../utils/formatter.js", "../utils/api.js", "../utils/router.js");

const TARGET_URLS = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/new",
  gemini: "https://gemini.google.com/app",
  perplexity: "https://www.perplexity.ai/",
  grok: "https://grok.x.ai/"
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, data } = message;

  if (action === "SAVE_BOOKMARK") {
    handleSaveBookmark(data).then(sendResponse);
    return true;
  }

  if (action === "HOP") {
    handleHop(data).then(sendResponse);
    return true;
  }

  if (action === "COMPARE_HOP") {
    handleCompareHop(data).then(sendResponse);
    return true;
  }

  if (action === "GET_BOOKMARKS") {
    getBookmarks().then((bookmarks) => sendResponse({ success: true, bookmarks }));
    return true;
  }

  if (action === "DELETE_BOOKMARK") {
    deleteBookmark(data.id).then(() => sendResponse({ success: true }));
    return true;
  }

  if (action === "UPDATE_BOOKMARK") {
    updateBookmark(data.id, data.updates).then(() => sendResponse({ success: true }));
    return true;
  }

  if (action === "SEARCH_BOOKMARKS") {
    searchBookmarks(data.query).then((results) => sendResponse({ success: true, results }));
    return true;
  }

  if (action === "GET_HOP_HISTORY") {
    chrome.storage.local
      .get("chathop_hop_history")
      .then((result) => sendResponse({ success: true, history: result.chathop_hop_history || [] }));
    return true;
  }

  if (action === "GET_COMPARE_SESSIONS") {
    getCompareSessions().then((sessions) => sendResponse({ success: true, sessions }));
    return true;
  }

  if (action === "RECORD_COMPARE_RESULT") {
    recordCompareResult(data.sessionId, data.winnerPlatform).then((session) =>
      sendResponse({ success: Boolean(session), session })
    );
    return true;
  }

  if (action === "GET_PENDING_HOP") {
    getPendingHop().then((pendingHop) => sendResponse({ success: true, pendingHop }));
    return true;
  }

  if (action === "CLEAR_PENDING_HOP") {
    clearPendingHop().then(() => sendResponse({ success: true }));
    return true;
  }

  if (action === "SUGGEST_PLATFORM") {
    getRoutingInsights().then((insights) => {
      const suggestion = suggestPlatform(data.conversation, data.currentPlatform, insights);
      sendResponse({ success: true, suggestion });
    });
    return true;
  }

  return false;
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const { action, data } = message || {};

  if (action === "GET_BOOKMARKS") {
    getBookmarks().then((bookmarks) => sendResponse({ success: true, bookmarks }));
    return true;
  }

  if (action === "SEARCH_BOOKMARKS") {
    searchBookmarks(data?.query || "").then((results) => sendResponse({ success: true, results }));
    return true;
  }

  if (action === "GET_HOP_HISTORY") {
    chrome.storage.local
      .get("chathop_hop_history")
      .then((result) => sendResponse({ success: true, history: result.chathop_hop_history || [] }));
    return true;
  }

  if (action === "GET_COMPARE_SESSIONS") {
    getCompareSessions().then((sessions) => sendResponse({ success: true, sessions }));
    return true;
  }

  if (action === "RECORD_COMPARE_RESULT") {
    recordCompareResult(data?.sessionId, data?.winnerPlatform).then((session) =>
      sendResponse({ success: Boolean(session), session })
    );
    return true;
  }

  if (action === "SAVE_BOOKMARK") {
    handleSaveBookmark(data).then(sendResponse);
    return true;
  }

  if (action === "HOP") {
    handleHop(data).then(sendResponse);
    return true;
  }

  if (action === "COMPARE_HOP") {
    handleCompareHop(data).then(sendResponse);
    return true;
  }

  if (action === "DELETE_BOOKMARK") {
    deleteBookmark(data?.id).then(() => sendResponse({ success: true }));
    return true;
  }

  return false;
});

async function handleSaveBookmark(conversation) {
  try {
    if (!conversation || !Array.isArray(conversation.messages) || conversation.messages.length === 0) {
      return { success: false, error: "No conversation found" };
    }

    const bookmark = await saveBookmark(conversation);
    return { success: true, bookmark };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleHop(payload) {
  const { conversation, targetPlatform, targetUrl, mode } = payload;

  try {
    let text;

    if (mode === "full") {
      text = formatFullDump(conversation);
    } else {
      const summary = await compressConversation(conversation);
      text = formatInjectionText(summary, conversation.platform, "smart");
    }

    const pendingHop = {
      text,
      targetPlatform,
      createdAt: Date.now(),
      mode
    };

    await setPendingHop(pendingHop);

    const tab = await chrome.tabs.create({
      url: targetUrl || TARGET_URLS[targetPlatform] || TARGET_URLS.chatgpt
    });

    await waitForTabComplete(tab.id);
    await sleep(1200);

    await chrome.tabs.sendMessage(tab.id, {
      action: "INJECT_CONTEXT",
      text
    });

    await logHop(conversation.platform, targetPlatform, mode);

    return { success: true };
  } catch (error) {
    if (mode === "smart") {
      const fallbackText = formatFullDump(conversation);
      const fallbackPendingHop = {
        text: fallbackText,
        targetPlatform,
        createdAt: Date.now(),
        mode: "full"
      };

      await setPendingHop(fallbackPendingHop);
      return { success: true, fallback: "full", error: error.message };
    }

    return { success: false, error: error.message };
  }
}

async function handleCompareHop(payload) {
  const { conversation, primaryPlatform, secondaryPlatform, mode } = payload;

  try {
    let text;

    if (mode === "full") {
      text = formatFullDump(conversation);
    } else {
      const summary = await compressConversation(conversation);
      text = formatInjectionText(summary, conversation.platform, "smart");
    }

    const primaryUrl = TARGET_URLS[primaryPlatform] || TARGET_URLS.chatgpt;
    const secondaryUrl = TARGET_URLS[secondaryPlatform] || TARGET_URLS.claude;

    const tabs = await Promise.all([
      chrome.tabs.create({ url: primaryUrl }),
      chrome.tabs.create({ url: secondaryUrl })
    ]);

    const compareSession = await createCompareSession({
      fromPlatform: conversation.platform,
      primaryPlatform,
      secondaryPlatform,
      mode,
      title: conversation.title || "Untitled"
    });

    for (const tab of tabs) {
      await waitForTabComplete(tab.id);
      await sleep(1200);
      await chrome.tabs.sendMessage(tab.id, { action: "INJECT_CONTEXT", text });
    }

    await logHop(conversation.platform, primaryPlatform, "compare");
    await logHop(conversation.platform, secondaryPlatform, "compare");

    return { success: true, compareSessionId: compareSession.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    function onUpdated(id, changeInfo) {
      if (id === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
