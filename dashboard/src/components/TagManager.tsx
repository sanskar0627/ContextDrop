"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
}

export function TagManager({ tags, onAddTag }: TagManagerProps) {
  const [draft, setDraft] = useState("");

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <h3 className="font-semibold">Tags</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
          className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
          placeholder="Add a tag"
        />
        <button
          className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
          onClick={() => {
            const cleaned = draft.trim();
            if (!cleaned) {
              return;
            }
            onAddTag(cleaned);
            setDraft("");
          }}
        >
          Add
        </button>
      </div>
    </section>
  );
}
