"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { getBookmarks } from "@/lib/bridge";
import { getAuthenticatedUser, syncBookmarksToCloud } from "@/lib/cloudSync";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  async function saveSettings() {
    if (!window.chrome?.storage?.local) {
      return;
    }

    await window.chrome.storage.local.set({
      chathop_settings: {
        apiKey
      }
    });
  }

  async function syncNow() {
    setSyncMessage("Syncing...");
    const user = await getAuthenticatedUser();
    if (!user) {
      setSyncMessage("Sign in first to sync to cloud.");
      return;
    }

    const bookmarks = await getBookmarks();
    await syncBookmarksToCloud(user.id, bookmarks);
    setSyncMessage(`Synced ${bookmarks.length} bookmarks to cloud.`);
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-zinc-500 mt-1">Configure Smart Summary and local data controls.</p>

      <section className="mt-6 max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <label htmlFor="api-key" className="text-sm font-semibold">
          Anthropic API Key
        </label>
        <input
          id="api-key"
          type="password"
          className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2"
          value={apiKey}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setApiKey(event.target.value)}
          placeholder="sk-ant-..."
        />
        <button
          onClick={saveSettings}
          className="mt-4 rounded-xl bg-[var(--ink)] text-white px-4 py-2 text-sm font-semibold"
        >
          Save
        </button>

        <button
          onClick={syncNow}
          className="mt-3 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
        >
          Sync Bookmarks To Cloud
        </button>
        {syncMessage ? <p className="mt-2 text-xs text-zinc-500">{syncMessage}</p> : null}
      </section>
    </main>
  );
}
