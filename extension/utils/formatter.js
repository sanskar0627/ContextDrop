function capitalize(input) {
  if (!input) {
    return "Unknown";
  }

  return input.charAt(0).toUpperCase() + input.slice(1);
}

function formatFullDump(conversation) {
  const meta = [
    `=== Conversation from ${capitalize(conversation.platform)} ===`,
    `Topic: ${conversation.title || "Untitled"}`,
    `Messages: ${conversation.messageCount || (conversation.messages || []).length}`,
    `Date: ${new Date(conversation.timestamp || Date.now()).toLocaleString()}`,
    ""
  ].join("\n");

  const body = (conversation.messages || [])
    .map((message) => {
      const role = message.role === "user" ? "User" : "Assistant";
      return `${role}: ${message.content || ""}`;
    })
    .join("\n\n");

  const lastUserMessage = [...(conversation.messages || [])]
    .reverse()
    .find((message) => message.role === "user");

  const footer = `\n\nPlease continue this conversation. Last user ask:\n${lastUserMessage?.content || "N/A"}`;

  return `${meta}${body}${footer}`;
}

function formatSmartSummaryPrompt(conversation) {
  const conversationText = (conversation.messages || [])
    .map((message) => `[${message.role}]: ${message.content || ""}`)
    .join("\n\n");

  return {
    system: "You are a conversation compressor. Produce a concise continuation prompt under 500 words. Start with 'I've been working on...' and end with a clear ask. Include project context, decisions, current state, blocker, and last ask. Keep technical details that matter; remove chatter.",
    user: `Compress this conversation for transfer to another AI platform:\n\n${conversationText}`
  };
}

function formatInjectionText(contextText, fromPlatform, mode) {
  if (mode === "full") {
    return contextText;
  }

  return `[Context transferred from ${capitalize(fromPlatform)} via ChatHop]\n\n${contextText}`;
}
