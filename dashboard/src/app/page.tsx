"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { BookmarksGrid } from "@/components/BookmarksGrid";
import { EmptyState } from "@/components/EmptyState";
import { AuthBar } from "@/components/AuthBar";
import { getBookmarks } from "@/lib/bridge";
import { useBookmarkStore } from "@/lib/store";
import { getAuthenticatedUser, getCloudBookmarks, syncBookmarksToCloud } from "@/lib/cloudSync";

export default function HomePage() {
  const { bookmarks, setBookmarks } = useBookmarkStore();
  const [activePlatform, setActivePlatform] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadBookmarks() {
      const localBookmarks = await getBookmarks();
      setBookmarks(localBookmarks);

      const user = await getAuthenticatedUser();
      if (!user) {
        return;
      }

      await syncBookmarksToCloud(user.id, localBookmarks);
      const cloudBookmarks = await getCloudBookmarks(user.id);
      if (cloudBookmarks.length) {
        setBookmarks(cloudBookmarks);
      }
    }

    loadBookmarks();
  }, [setBookmarks]);

  const filtered = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      if (activePlatform !== "all" && bookmark.platform !== activePlatform) {
        return false;
      }

      if (!search.trim()) {
        return true;
      }

      const query = search.toLowerCase();
      const payload = `${bookmark.title} ${(bookmark.messages || []).map((message) => message.content).join(" ")} ${(bookmark.customTags || []).join(" ")}`.toLowerCase();
      return payload.includes(query);
    });
  }, [activePlatform, bookmarks, search]);

  return (
    <main className="md:flex min-h-screen">
      <Sidebar activePlatform={activePlatform} onPlatformChange={setActivePlatform} />
      <section className="flex-1 p-4 md:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <AuthBar />
        </div>
        <div className="mt-5">{filtered.length ? <BookmarksGrid bookmarks={filtered} /> : <EmptyState />}</div>
      </section>
    </main>
  );
}
