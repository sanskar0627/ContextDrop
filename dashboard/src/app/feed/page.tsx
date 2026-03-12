"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/cloudSync";
import {
  getPublications,
  subscribeToPublicationChanges,
  unsubscribeChannel,
  upvotePublication,
  type Publication
} from "@/lib/social";

const CATEGORIES = ["all", "coding", "writing", "research", "creative", "debate"];

export default function FeedPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function refresh() {
      const rows = await getPublications(category);
      if (active) {
        setPublications(rows);
      }
    }

    refresh();

    const channel = subscribeToPublicationChanges(() => {
      refresh();
    });

    return () => {
      active = false;
      unsubscribeChannel(channel);
    };
  }, [category]);

  async function handleUpvote(publicationId: string) {
    setMessage("");
    const user = await getAuthenticatedUser();
    if (!user) {
      setMessage("Sign in first to upvote.");
      return;
    }

    try {
      await upvotePublication(publicationId);
      const latest = await getPublications(category);
      setPublications(latest);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upvote failed.");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-bold">Community Feed</h1>
      <p className="text-zinc-500 mt-1">Discover high-signal AI conversations shared by users.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`rounded-full px-3 py-1 text-xs border ${category === item ? "border-[var(--brand)] bg-orange-50" : "border-[var(--line)] bg-white"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {message ? <p className="mt-3 text-xs text-zinc-500">{message}</p> : null}

      <section className="mt-6 grid gap-3">
        {publications.map((publication) => {
          const preview = publication.messages?.[0]?.content || "No preview";
          return (
            <article key={publication.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{publication.title}</h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    {publication.platform} · {publication.category || "uncategorized"}
                  </p>
                  <Link href={`/users/${publication.user_id}`} className="text-xs text-[var(--brand)] font-semibold mt-1 inline-block">
                    View profile
                  </Link>
                </div>
                <button
                  onClick={() => handleUpvote(publication.id)}
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
                >
                  Upvote ({publication.upvote_count})
                </button>
              </div>
              <p className="text-sm text-zinc-600 mt-3">{preview.slice(0, 240)}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
