async function extractConversation() {
  const messages = [];
  const queries = Array.from(document.querySelectorAll(".prose-query, [class*='query']"));
  const answers = Array.from(document.querySelectorAll(".prose-answer, [class*='answer']"));
  const total = Math.max(queries.length, answers.length);

  for (let index = 0; index < total; index += 1) {
    const queryText = (queries[index]?.innerText || "").trim();
    const answerText = (answers[index]?.innerText || "").trim();

    if (queryText) {
      messages.push({ role: "user", content: queryText });
    }

    if (answerText) {
      messages.push({ role: "assistant", content: answerText });
    }
  }

  return {
    platform: "perplexity",
    title: document.title.replace(" - Perplexity", "").trim() || "Untitled Perplexity conversation",
    url: window.location.href,
    messages,
    messageCount: messages.length,
    wordCount: messages.reduce((sum, message) => sum + message.content.split(/\s+/).filter(Boolean).length, 0),
    timestamp: new Date().toISOString(),
    tags: ["perplexity"],
    customTags: []
  };
}

async function injectIntoInput(text) {
  const input = document.querySelector("textarea[placeholder*='Ask'], textarea");
  if (!(input instanceof HTMLTextAreaElement)) {
    return false;
  }

  input.focus();
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "INJECT_CONTEXT") {
    injectIntoInput(message.text).then((success) => sendResponse({ success }));
    return true;
  }
  return false;
});
