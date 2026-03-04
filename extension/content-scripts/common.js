function detectPlatform() {
  const hostname = window.location.hostname;

  if (hostname.includes("chat.openai.com") || hostname.includes("chatgpt.com")) {
    return "chatgpt";
  }
  if (hostname.includes("claude.ai")) {
    return "claude";
  }
  if (hostname.includes("gemini.google.com")) {
    return "gemini";
  }
  if (hostname.includes("perplexity.ai")) {
    return "perplexity";
  }
  if (hostname.includes("grok.x.ai")) {
    return "grok";
  }

  return "unknown";
}

const CURRENT_PLATFORM = detectPlatform();
const HOP_TARGETS = [
  { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", label: "Claude", url: "https://claude.ai/new" },
  { id: "gemini", label: "Gemini", url: "https://gemini.google.com/app" },
  { id: "perplexity", label: "Perplexity", url: "https://www.perplexity.ai/" },
  { id: "grok", label: "Grok", url: "https://grok.x.ai/" }
];

function getComparePair(currentPlatform, selectedPlatform) {
  const candidates = HOP_TARGETS.filter(
    (target) => target.id !== currentPlatform && target.id !== selectedPlatform
  );

  return {
    primary: selectedPlatform,
    secondary: candidates[0]?.id || "claude"
  };
}

function sendToBackground(action, data) {
  return chrome.runtime.sendMessage({ action, data, platform: CURRENT_PLATFORM });
}

function showToast(message) {
  const existing = document.getElementById("chathop-toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = "chathop-toast";
  toast.className = "chathop-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 240);
  }, 1800);
}

function getWordCount(conversation) {
  return (conversation.messages || []).reduce((total, message) => {
    const words = (message.content || "").trim().split(/\s+/).filter(Boolean).length;
    return total + words;
  }, 0);
}

async function onBookmarkClick() {
  try {
    const conversation = await extractConversation();
    const result = await sendToBackground("SAVE_BOOKMARK", conversation);

    if (result?.success) {
      showToast("Saved to ChatHop");
    } else {
      showToast(result?.error || "Could not save bookmark");
    }
  } catch (error) {
    showToast(error.message || "Could not read conversation");
  }
}

async function onHopClick(target) {
  try {
    const conversation = await extractConversation();
    if (!conversation?.messages?.length) {
      showToast("No conversation found for hop");
      return;
    }

    showTransferModal(conversation, target);
  } catch (error) {
    showToast(error.message || "Hop failed");
  }
}

async function showTransferModal(conversation, target) {
  const suggested = await sendToBackground("SUGGEST_PLATFORM", {
    conversation,
    currentPlatform: CURRENT_PLATFORM
  });

  const recommendation = suggested?.suggestion;
  const isRecommendedTarget = recommendation?.platform === target.id;

  const wrapper = document.createElement("div");
  wrapper.id = "chathop-transfer-modal";
  wrapper.innerHTML = `
    <div class="chathop-modal-overlay">
      <div class="chathop-modal" role="dialog" aria-modal="true" aria-label="Transfer context">
        <h3>Transfer to ${target.label}</h3>
        <p class="chathop-meta">${conversation.messages.length} messages · ${getWordCount(conversation).toLocaleString()} words</p>
        ${isRecommendedTarget ? `<p class="chathop-recommend">Recommended: ${recommendation.reason}</p>` : ""}
        <div class="chathop-transfer-options">
          <button class="chathop-option" data-mode="full">Full dump</button>
          <button class="chathop-option recommended" data-mode="smart">Smart summary</button>
          <button class="chathop-option" data-mode="edit">Edit mode</button>
          <button class="chathop-option" data-mode="compare">Compare mode</button>
        </div>
        <button class="chathop-cancel" data-close="true">Cancel</button>
      </div>
    </div>
  `;

  wrapper.addEventListener("click", async (event) => {
    const targetEl = event.target;
    if (!(targetEl instanceof HTMLElement)) {
      return;
    }

    if (targetEl.dataset.close === "true" || targetEl.classList.contains("chathop-modal-overlay")) {
      wrapper.remove();
      return;
    }

    if (!targetEl.dataset.mode) {
      return;
    }

    const mode = targetEl.dataset.mode;
    wrapper.remove();

    if (mode === "edit") {
      showEditModal(conversation, target);
      return;
    }

    if (mode === "compare") {
      const comparePair = getComparePair(CURRENT_PLATFORM, target.id);
      const compareResult = await sendToBackground("COMPARE_HOP", {
        conversation,
        primaryPlatform: comparePair.primary,
        secondaryPlatform: comparePair.secondary,
        mode: "smart"
      });

      if (compareResult?.success) {
        showToast(`Compare opened: ${comparePair.primary} vs ${comparePair.secondary}`);
      } else {
        showToast(compareResult?.error || "Compare hop failed");
      }
      return;
    }

    const result = await sendToBackground("HOP", {
      conversation,
      targetPlatform: target.id,
      targetUrl: target.url,
      mode
    });

    if (result?.success) {
      showToast(`Hopping to ${target.label}`);
    } else {
      showToast(result?.error || "Hop failed");
    }
  });

  document.body.appendChild(wrapper);
}

function showEditModal(conversation, target) {
  const allText = (conversation.messages || [])
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n\n")
    .slice(0, 10000);

  const wrapper = document.createElement("div");
  wrapper.id = "chathop-edit-modal";
  wrapper.innerHTML = `
    <div class="chathop-modal-overlay">
      <div class="chathop-modal chathop-modal-large" role="dialog" aria-modal="true" aria-label="Edit transfer text">
        <h3>Edit transfer text</h3>
        <textarea class="chathop-editor" id="chathop-editor">${escapeHtml(allText)}</textarea>
        <div class="chathop-editor-actions">
          <button class="chathop-cancel" data-close="true">Cancel</button>
          <button class="chathop-send" data-send="true">Send to ${target.label}</button>
        </div>
      </div>
    </div>
  `;

  wrapper.addEventListener("click", async (event) => {
    const targetEl = event.target;
    if (!(targetEl instanceof HTMLElement)) {
      return;
    }

    if (targetEl.dataset.close === "true") {
      wrapper.remove();
      return;
    }

    if (targetEl.dataset.send !== "true") {
      return;
    }

    const textarea = wrapper.querySelector("#chathop-editor");
    if (!(textarea instanceof HTMLTextAreaElement)) {
      showToast("Could not read edited text");
      return;
    }

    const customConversation = {
      ...conversation,
      messages: [{ role: "user", content: textarea.value.trim() || allText }],
      messageCount: 1
    };

    const result = await sendToBackground("HOP", {
      conversation: customConversation,
      targetPlatform: target.id,
      targetUrl: target.url,
      mode: "full"
    });

    wrapper.remove();
    if (result?.success) {
      showToast(`Hopping to ${target.label}`);
    } else {
      showToast(result?.error || "Hop failed");
    }
  });

  document.body.appendChild(wrapper);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createFab() {
  if (document.getElementById("chathop-fab")) {
    return;
  }

  const fab = document.createElement("div");
  fab.id = "chathop-fab";
  fab.innerHTML = `
    <button class="chathop-main-btn" aria-label="Save conversation">↕</button>
    <div class="chathop-menu" id="chathop-menu"></div>
  `;

  const mainBtn = fab.querySelector(".chathop-main-btn");
  const menu = fab.querySelector("#chathop-menu");

  for (const target of HOP_TARGETS.filter((item) => item.id !== CURRENT_PLATFORM)) {
    const button = document.createElement("button");
    button.className = "chathop-menu-item";
    button.textContent = `Hop to ${target.label}`;
    button.addEventListener("click", () => onHopClick(target));
    menu.appendChild(button);
  }

  const bookmarkButton = document.createElement("button");
  bookmarkButton.className = "chathop-menu-item strong";
  bookmarkButton.textContent = "Save bookmark";
  bookmarkButton.addEventListener("click", onBookmarkClick);
  menu.prepend(bookmarkButton);

  mainBtn.addEventListener("click", () => {
    fab.classList.toggle("open");
  });

  document.body.appendChild(fab);
}

async function tryInjectPendingHop() {
  const response = await sendToBackground("GET_PENDING_HOP", {});
  const pendingHop = response?.pendingHop;

  if (!pendingHop?.text || pendingHop.targetPlatform !== CURRENT_PLATFORM) {
    return;
  }

  const injected = await injectIntoInput(pendingHop.text);
  if (injected) {
    showToast("Context injected. Review and send.");
    await sendToBackground("CLEAR_PENDING_HOP", {});
  }
}

function initChatHop() {
  createFab();
  tryInjectPendingHop();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChatHop);
} else {
  initChatHop();
}
