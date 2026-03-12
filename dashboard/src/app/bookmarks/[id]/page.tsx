"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ConversationReader } from "@/components/ConversationReader";
import { HopButton } from "@/components/HopButton";
import { TagManager } from "@/components/TagManager";
import { PublishButton } from "@/components/PublishButton";
import { getBookmarks } from "@/lib/bridge";
import { getAuthenticatedUser } from "@/lib/cloudSync";
import { getPublicationsByUser, type Publication } from "@/lib/social";
import type { Bookmark } from "@/lib/types";

export default function BookmarkDetailPage() {
  const params = useParams<{ id: string }>();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [linkedPublication, setLinkedPublication] = useState<Publication | null>(null);

  useEffect(() => {
    getBookmarks().then(setBookmarks);
  }, []);

  const bookmark = useMemo(
    () => bookmarks.find((item) => item.id === String(params.id)),
    [bookmarks, params.id]
  );

  useEffect(() => {
    if (!bookmark) {
      return;
    }

    const currentBookmark = bookmark;
    setTags([...(bookmark.tags || []), ...(bookmark.customTags || [])]);

    async function refreshPublication() {
      const user = await getAuthenticatedUser();
      if (!user) {
        setLinkedPublication(null);
        return;
      }

      const publications = await getPublicationsByUser(user.id);
      const matched = publications.find(
        (publication) =>
          publication.title === currentBookmark.title &&
          publication.platform === currentBookmark.platform
      );
      setLinkedPublication(matched || null);
    }

    refreshPublication();
  }, [bookmark]);

  if (!bookmark) {
    return (
      <main className="min-h-screen p-6 md:p-10">
        <p className="text-zinc-500">Bookmark not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">{bookmark.title}</h1>
        <HopButton bookmark={bookmark} />
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <ConversationReader bookmark={bookmark} />
        <div className="grid gap-3">
          <TagManager tags={tags} onAddTag={(tag) => setTags((prev: string[]) => [...prev, tag])} />
          <PublishButton
            bookmark={bookmark}
            publication={linkedPublication}
            onPublicationChange={async () => {
              const user = await getAuthenticatedUser();
              if (!user) {
                setLinkedPublication(null);
                return;
              }
              const publications = await getPublicationsByUser(user.id);
              const matched = publications.find(
                (publication) => publication.title === bookmark.title && publication.platform === bookmark.platform
              );
              setLinkedPublication(matched || null);
            }}
          />
        </div>
      </div>
    </main>
  );
}
