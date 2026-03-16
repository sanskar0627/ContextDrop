"use client";

import Link from "next/link";

interface SidebarProps {
  activePlatform: string;
  onPlatformChange: (platform: string) => void;
}

const PLATFORMS = ["all", "chatgpt", "claude", "gemini", "perplexity", "grok"];

export function Sidebar({ activePlatform, onPlatformChange }: SidebarProps) {
  return (
    <aside className="w-full md:w-72 border-r border-[var(--line)] bg-white/80 backdrop-blur p-4 md:p-6">
      <h1 className="text-2xl font-bold">ContextDrop</h1>
      <p className="text-sm text-zinc-500 mt-1">Your AI command center</p>

      <div className="mt-6 grid gap-2">
        <Link
          href="/feed"
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-left text-sm"
        >
          Community Feed
        </Link>
        <Link
          href="/following"
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-left text-sm"
        >
          Following Feed
        </Link>
        <Link
          href="/stats"
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-left text-sm"
        >
          Personal Stats
        </Link>
        <Link
          href="/compare"
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-left text-sm"
        >
          Compare Results
        </Link>
        {PLATFORMS.map((platform) => (
          <button
            key={platform}
            className={`rounded-xl border px-3 py-2 text-left text-sm capitalize ${
              activePlatform === platform
                ? "border-[var(--brand)] bg-orange-50"
                : "border-[var(--line)] bg-white"
            }`}
            onClick={() => onPlatformChange(platform)}
          >
            {platform}
          </button>
        ))}
      </div>
    </aside>
  );
}
