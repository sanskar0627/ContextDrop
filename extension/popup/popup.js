const TARGETS = [
  { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", label: "Claude", url: "https://claude.ai/new" },
  { id: "gemini", label: "Gemini", url: "https://gemini.google.com/app" },
  { id: "perplexity", label: "Perplexity", url: "https://www.perplexity.ai/" },
  { id: "grok", label: "Grok", url: "https://grok.x.ai/" }
];

document.addEventListener("DOMContentLoaded", async () => {
  const bookmarksResponse = await chrome.runtime.sendMessage({ action: "GET_BOOKMARKS" });
  renderBookmarks(bookmarksResponse?.bookmarks || []);

  const dashboardBtn = document.getElementById("open-dashboard");
  dashboardBtn?.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/index.html") });
  });
});

function renderBookmarks(bookmarks) {
  const container = document.getElementById("bookmarks");
  if (!container) {
    return;
  }

  if (!bookmarks.length) {
    container.innerHTML = '<p class="empty">No bookmarks yet. Save one from an AI chat page.</p>';
    return;
  }

  container.innerHTML = bookmarks.slice(0, 10).map((bookmark) => {
    const fromNow = relativeDate(bookmark.createdAt);
    return `
      <article class="bookmark-item" data-bookmark-id="${bookmark.id}">
        <div class="bookmark-top">
          <span class="platform">${bookmark.platform}</span>
          <button data-action="delete" data-id="${bookmark.id}">Delete</button>
        </div>
        <h3 class="title" title="${escapeHtml(bookmark.title || "Untitled")}">${escapeHtml(bookmark.title || "Untitled")}</h3>
        <p class="meta">${bookmark.messageCount || 0} messages · ${fromNow}</p>
        <div class="actions">
          ${TARGETS.filter((target) => target.id !== bookmark.platform)
            .slice(0, 3)
            .map((target) => `<button data-action="hop" data-id="${bookmark.id}" data-target="${target.id}" data-url="${target.url}">Hop ${target.label}</button>`)
            .join("")}
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("button[data-action='delete']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
      await chrome.runtime.sendMessage({ action: "DELETE_BOOKMARK", data: { id } });
      const updated = await chrome.runtime.sendMessage({ action: "GET_BOOKMARKS" });
      renderBookmarks(updated?.bookmarks || []);
    });
  });

  container.querySelectorAll("button[data-action='hop']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
      const targetPlatform = button.getAttribute("data-target");
      const targetUrl = button.getAttribute("data-url");

      const listResult = await chrome.runtime.sendMessage({ action: "GET_BOOKMARKS" });
      const bookmark = (listResult?.bookmarks || []).find((item) => item.id === id);
      if (!bookmark) {
        return;
      }

      await chrome.runtime.sendMessage({
        action: "HOP",
        data: {
          conversation: bookmark,
          targetPlatform,
          targetUrl,
          mode: "smart"
        }
      });

      window.close();
    });
  });
}

function relativeDate(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) {
    return "just now";
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }
  return `${Math.floor(seconds / 86400)}d ago`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
