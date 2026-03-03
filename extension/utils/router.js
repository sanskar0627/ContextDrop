const ROUTING_RULES = [
  {
    id: "coding",
    keywords: ["code", "bug", "error", "typescript", "javascript", "python", "api", "debug"],
    recommended: "claude",
    reason: "This looks like a coding/debugging task. Claude is usually strongest here."
  },
  {
    id: "research",
    keywords: ["research", "source", "citation", "paper", "compare", "market"],
    recommended: "perplexity",
    reason: "This looks research-heavy. Perplexity is strong for web-grounded answers with citations."
  },
  {
    id: "writing",
    keywords: ["write", "rewrite", "tone", "essay", "blog", "copy"],
    recommended: "claude",
    reason: "This seems writing-focused. Claude usually produces strong long-form prose."
  },
  {
    id: "realtime",
    keywords: ["news", "today", "latest", "twitter", "x.com", "real-time"],
    recommended: "grok",
    reason: "This appears real-time info oriented. Grok can be best for live X context."
  }
];

function suggestPlatform(conversation, currentPlatform, insights = {}) {
  const text = (conversation.messages || [])
    .slice(-6)
    .map((message) => message.content || "")
    .join(" ")
    .toLowerCase();

  const winnerCounts = insights.winnerCounts || {};
  const topWinner = Object.entries(winnerCounts).sort((a, b) => b[1] - a[1])[0];
  if (topWinner && topWinner[0] !== currentPlatform && (insights.totalResolvedComparisons || 0) >= 3) {
    return {
      platform: topWinner[0],
      reason: `Based on your compare history, ${topWinner[0]} has produced the best results most often.`
    };
  }

  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      if (rule.recommended === currentPlatform) {
        return {
          platform: "chatgpt",
          reason: "Current platform already matches the task. ChatGPT is a good alternate to compare."
        };
      }

      return {
        platform: rule.recommended,
        reason: rule.reason
      };
    }
  }

  return {
    platform: "chatgpt",
    reason: "General purpose fallback recommendation."
  };
}
