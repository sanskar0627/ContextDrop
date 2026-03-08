const PLATFORM_COLORS = {
  chatgpt: "#10a37f",
  claude: "#d97706",
  gemini: "#2563eb",
  perplexity: "#0ea5e9",
  grok: "#334155"
};

const TARGETS = [
  { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", label: "Claude", url: "https://claude.ai/new" },
  { id: "gemini", label: "Gemini", url: "https://gemini.google.com/app" },
  { id: "perplexity", label: "Perplexity", url: "https://www.perplexity.ai/" },
  { id: "grok", label: "Grok", url: "https://grok.x.ai/" }
];

const state = {
  bookmarks: [],
  filtered: [],
  activePlatform: "all",
  search: "",
  sort: "newest",
  selectedBookmark: null
};

document.addEventListener("DOMContentLoaded", async () => {
  bindStaticEvents();
  await refreshBookmarks();
});

function bindStaticEvents() {
  document.getElementById("search-input")?.addEventListener("input", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    state.search = target.value.trim();
    if (state.search.length > 1) {
      const response = await chrome.runtime.sendMessage({
        action: "SEARCH_BOOKMARKS",
        data: { query: state.search }
      });
      state.filtered = response?.results || [];
      renderCards();
      return;
    }

    applyFilters();
  });

  document.getElementById("sort-select")?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    state.sort = target.value;
    applyFilters();
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  document.getElementById("reader-close")?.addEventListener("click", () => {
    document.getElementById("reader-dialog")?.close();
  });

  document.getElementById("reader-hop")?.addEventListener("click", async () => {
    if (!state.selectedBookmark) {
      return;
    }

    const target = TARGETS.find((item) => item.id !== state.selectedBookmark.platform) || TARGETS[0];
    await chrome.runtime.sendMessage({
      action: "HOP",
      data: {
        conversation: state.selectedBookmark,
        targetPlatform: target.id,
        targetUrl: target.url,
        mode: "smart"
      }
    });
  });
}

async function refreshBookmarks() {
  const response = await chrome.runtime.sendMessage({ action: "GET_BOOKMARKS" });
  state.bookmarks = response?.bookmarks || [];
  renderPlatformFilters();
  applyFilters();
}

function renderPlatformFilters() {
  const host = document.getElementById("platform-filters");
  if (!host) {
    return;
  }

  const platforms = ["all", ...new Set(state.bookmarks.map((bookmark) => bookmark.platform))];
  host.innerHTML = platforms
    .map((platform) => {
      const style = platform === "all" ? "" : `style=\"border-left: 4px solid ${PLATFORM_COLORS[platform] || "#94a3b8"}\"`;
      return `<button class="platform-filter ${state.activePlatform === platform ? "active" : ""}" data-platform="${platform}" ${style}>${platform}</button>`;
    })
    .join("");

  host.querySelectorAll(".platform-filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePlatform = button.getAttribute("data-platform") || "all";
      renderPlatformFilters();
      applyFilters();
    });
  });
}

function applyFilters() {
  let result = [...state.bookmarks];

  if (state.activePlatform !== "all") {
    result = result.filter((bookmark) => bookmark.platform === state.activePlatform);
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter((bookmark) => {
      const title = (bookmark.title || "").toLowerCase();
      const tagText = [...(bookmark.tags || []), ...(bookmark.customTags || [])].join(" ").toLowerCase();
      const messageText = (bookmark.messages || []).map((message) => message.content || "").join(" ").toLowerCase();
      return title.includes(q) || tagText.includes(q) || messageText.includes(q);
    });
  }

  result = sortBookmarks(result, state.sort);
  state.filtered = result;
  renderCards();
}

function sortBookmarks(bookmarks, sortKey) {
  const sorted = [...bookmarks];

  if (sortKey === "oldest") {
    sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return sorted;
  }

  if (sortKey === "platform") {
    sorted.sort((a, b) => (a.platform || "").localeCompare(b.platform || ""));
    return sorted;
  }

  if (sortKey === "messages") {
    sorted.sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
    return sorted;
  }

  sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return sorted;
}

function renderCards() {
  const host = document.getElementById("cards");
  if (!host) {
    return;
  }

  if (!state.filtered.length) {
    host.innerHTML = "<p class='meta'>No bookmarks match your filters.</p>";
    return;
  }

  host.innerHTML = state.filtered
    .map((bookmark) => {
      const firstMessage = (bookmark.messages || [])[0]?.content || "No preview available";
      return `
        <article class="card" data-id="${bookmark.id}">
          <div class="card-header">
            <span class="badge">${bookmark.platform}</span>
            <span class="meta">${relativeDate(bookmark.createdAt)}</span>
          </div>
          <h3 title="${escapeHtml(bookmark.title || "Untitled")}">${escapeHtml(bookmark.title || "Untitled")}</h3>
          <p class="preview">${escapeHtml(firstMessage.slice(0, 150))}</p>
          <p class="meta">${bookmark.messageCount || 0} messages · ${bookmark.wordCount || 0} words</p>
          <div class="card-actions">
            <button data-action="view" data-id="${bookmark.id}">Preview</button>
            <button data-action="hop" data-id="${bookmark.id}">Hop</button>
            <button data-action="delete" data-id="${bookmark.id}">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");

  host.querySelectorAll("button[data-action='view']").forEach((button) => {
    button.addEventListener("click", () => openReader(button.getAttribute("data-id")));
  });

  host.querySelectorAll("button[data-action='delete']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
      await chrome.runtime.sendMessage({ action: "DELETE_BOOKMARK", data: { id } });
      await refreshBookmarks();
    });
  });

  host.querySelectorAll("button[data-action='hop']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
      const bookmark = state.bookmarks.find((item) => item.id === id);
      if (!bookmark) {
        return;
      }

      const target = TARGETS.find((item) => item.id !== bookmark.platform) || TARGETS[0];
      await chrome.runtime.sendMessage({
        action: "HOP",
        data: {
          conversation: bookmark,
          targetPlatform: target.id,
          targetUrl: target.url,
          mode: "smart"
        }
      });
    });
  });
}

function openReader(id) {
  const bookmark = state.bookmarks.find((item) => item.id === id);
  if (!bookmark) {
    return;
  }

  state.selectedBookmark = bookmark;
  const title = document.getElementById("reader-title");
  const content = document.getElementById("reader-content");
  const dialog = document.getElementById("reader-dialog");

  if (!title || !content || !(dialog instanceof HTMLDialogElement)) {
    return;
  }

  title.textContent = bookmark.title || "Untitled";
  content.innerHTML = (bookmark.messages || [])
    .map((message) => `<div class=\"turn ${message.role}\">${escapeHtml(message.content || "")}</div>`)
    .join("");

  dialog.showModal();
}

function relativeDate(value) {
  const timestamp = new Date(value).getTime();
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
