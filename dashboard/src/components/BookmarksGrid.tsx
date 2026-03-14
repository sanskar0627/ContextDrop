import { BookmarkCard } from "./BookmarkCard";
import type { Bookmark } from "@/lib/types";

interface BookmarksGridProps {
  bookmarks: Bookmark[];
}

export function BookmarksGrid({ bookmarks }: BookmarksGridProps) {
  if (!bookmarks.length) {
    return <p className="text-zinc-500">No bookmarks found.</p>;
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
    </section>
  );
}
