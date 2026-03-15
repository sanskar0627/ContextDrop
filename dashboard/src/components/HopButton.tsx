"use client";

import type { Bookmark } from "@/lib/types";

interface HopButtonProps {
  bookmark: Bookmark;
}

export function HopButton({ bookmark }: HopButtonProps) {
  async function onHop() {
    if (!window.chrome?.runtime?.sendMessage) {
      return;
    }

    await window.chrome.runtime.sendMessage({
      action: "HOP",
      data: {
        conversation: bookmark,
        targetPlatform: bookmark.platform === "claude" ? "chatgpt" : "claude",
        mode: "smart"
      }
    });
  }

  return (
    <button onClick={onHop} className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
      Hop To Another AI
    </button>
  );
}
