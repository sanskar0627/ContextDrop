function normalizedText(element) {
  return (element?.innerText || "").trim();
}

async function extractConversation() {
  const nodes = document.querySelectorAll("[data-message-author-role]");
  const messages = [];

  nodes.forEach((node) => {
    const role = node.getAttribute("data-message-author-role") === "user" ? "user" : "assistant";
    const content = normalizedText(node.querySelector(".markdown, .whitespace-pre-wrap") || node);
    if (content) {
      messages.push({ role, content });
    }
  });

  return {
    platform: "chatgpt",
    title: document.title.replace(" - ChatGPT", "").trim() || "Untitled ChatGPT conversation",
    url: window.location.href,
    messages,
    messageCount: messages.length,
    wordCount: messages.reduce((sum, message) => sum + message.content.split(/\s+/).filter(Boolean).length, 0),
    timestamp: new Date().toISOString(),
    tags: ["chatgpt"],
    customTags: []
  };
}

async function injectIntoInput(text) {
  const input = document.querySelector("#prompt-textarea, textarea[data-id='root']");
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
