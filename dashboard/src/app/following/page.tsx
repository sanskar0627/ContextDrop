"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthenticatedUser } from "@/lib/cloudSync";
import {
  getFollowingFeed,
  subscribeToFollowingFeedChanges,
  unsubscribeChannel,
  type Publication
} from "@/lib/social";

export default function FollowingFeedPage() {
  const [items, setItems] = useState<Publication[]>([]);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    let active = true;

    async function load() {
      const user = await getAuthenticatedUser();
      if (!user) {
        if (active) {
          setMessage("Sign in to see posts from people you follow.");
          setItems([]);
        }
        return;
      }

      const feed = await getFollowingFeed(user.id);
      if (active) {
        setItems(feed);
        setMessage(feed.length ? "" : "No posts yet from followed users.");
      }
    }

    load();

    const channel = subscribeToFollowingFeedChanges(() => {
      load();
    });

    return () => {
      active = false;
      unsubscribeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-bold">Following Feed</h1>
      <p className="text-zinc-500 mt-1">Latest published conversations from creators you follow.</p>

      {message ? <p className="mt-4 text-sm text-zinc-500">{message}</p> : null}

      <section className="mt-6 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-xs text-zinc-500 mt-1">{item.platform} · {item.category || "uncategorized"}</p>
                <Link href={`/users/${item.user_id}`} className="text-xs text-[var(--brand)] font-semibold mt-1 inline-block">
                  View author
                </Link>
              </div>
            </div>
            <p className="text-sm text-zinc-600 mt-3">{item.messages?.[0]?.content?.slice(0, 240) || "No preview"}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
