"use client";

import { useState } from "react";
import type { Bookmark } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/cloudSync";
import { deletePublication, publishBookmark, type Publication } from "@/lib/social";

interface PublishButtonProps {
  bookmark: Bookmark;
  publication?: Publication | null;
  onPublicationChange?: () => Promise<void> | void;
}

export function PublishButton({ bookmark, publication, onPublicationChange }: PublishButtonProps) {
  const [category, setCategory] = useState("coding");
  const [message, setMessage] = useState("");

  async function onPublish() {
    setMessage("");
    const user = await getAuthenticatedUser();
    if (!user) {
      setMessage("Sign in with Google first.");
      return;
    }

    try {
      await publishBookmark(user.id, bookmark, category);
      setMessage("Published successfully.");
      await onPublicationChange?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed.");
    }
  }

  async function onUnpublish() {
    setMessage("");
    if (!publication) {
      return;
    }

    try {
      await deletePublication(publication.id);
      setMessage("Publication removed.");
      await onPublicationChange?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unpublish failed.");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
      <div className="flex items-center gap-2">
        <select
          className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="coding">Coding</option>
          <option value="writing">Writing</option>
          <option value="research">Research</option>
          <option value="creative">Creative</option>
          <option value="debate">Debate</option>
        </select>
        {publication ? (
          <button onClick={onUnpublish} className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold">
            Unpublish
          </button>
        ) : (
          <button onClick={onPublish} className="rounded-lg bg-[var(--ink)] text-white px-3 py-1 text-xs font-semibold">
            Publish
          </button>
        )}
      </div>
      {message ? <p className="mt-2 text-xs text-zinc-500">{message}</p> : null}
    </div>
  );
}
