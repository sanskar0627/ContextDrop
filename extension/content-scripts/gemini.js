async function extractConversation() {
  const messages = [];
  const turns = document.querySelectorAll("[data-message-id], .conversation-turn");

  turns.forEach((turn) => {
    const role = turn.closest("[data-turn-role='user']") ? "user" : "assistant";
    const content = (turn.innerText || "").trim();
    if (content) {
      messages.push({ role, content });
    }
  });

  return {
    platform: "gemini",
    title: document.title.replace(" - Google Gemini", "").trim() || "Untitled Gemini conversation",
    url: window.location.href,
    messages,
    messageCount: messages.length,
    wordCount: messages.reduce((sum, message) => sum + message.content.split(/\s+/).filter(Boolean).length, 0),
    timestamp: new Date().toISOString(),
    tags: ["gemini"],
    customTags: []
  };
}

async function injectIntoInput(text) {
  const editor = document.querySelector(".ql-editor, [contenteditable='true']");
  if (!(editor instanceof HTMLElement)) {
    return false;
  }

  editor.focus();
  editor.textContent = text;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "INJECT_CONTEXT") {
    injectIntoInput(message.text).then((success) => sendResponse({ success }));
    return true;
  }
  return false;
});
