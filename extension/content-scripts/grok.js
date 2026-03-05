async function extractConversation() {
  const messages = [];
  const nodes = document.querySelectorAll("[data-testid*='message'], .message-container");

  nodes.forEach((node) => {
    const dataTestId = node.getAttribute("data-testid") || "";
    const role = dataTestId.includes("user") ? "user" : "assistant";
    const content = (node.innerText || "").trim();
    if (content) {
      messages.push({ role, content });
    }
  });

  return {
    platform: "grok",
    title: document.title.replace(" - Grok", "").trim() || "Untitled Grok conversation",
    url: window.location.href,
    messages,
    messageCount: messages.length,
    wordCount: messages.reduce((sum, message) => sum + message.content.split(/\s+/).filter(Boolean).length, 0),
    timestamp: new Date().toISOString(),
    tags: ["grok"],
    customTags: []
  };
}

async function injectIntoInput(text) {
  const input = document.querySelector("textarea, [contenteditable='true']");

  if (input instanceof HTMLTextAreaElement) {
    input.focus();
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  if (input instanceof HTMLElement) {
    input.focus();
    input.textContent = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  return false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "INJECT_CONTEXT") {
    injectIntoInput(message.text).then((success) => sendResponse({ success }));
    return true;
  }
  return false;
});
