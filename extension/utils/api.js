const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function compressConversation(conversation) {
  const { system, user } = formatSmartSummaryPrompt(conversation);

  const storageResult = await chrome.storage.local.get("chathop_settings");
  const apiKey = storageResult.chathop_settings?.apiKey;

  if (!apiKey) {
    throw new Error("Missing Anthropic API key. Add it in ContextDrop settings.");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 900,
      system,
      messages: [{ role: "user", content: user }]
    })
  });

  if (!response.ok) {
    throw new Error(`Smart summary failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.content?.[0]?.text || "";
}
