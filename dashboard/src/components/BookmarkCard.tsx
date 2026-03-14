import Link from "next/link";
import { PlatformBadge } from "./PlatformBadge";
import type { Bookmark } from "@/lib/types";

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const preview = bookmark.messages?.[0]?.content || "No preview available";

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <PlatformBadge platform={bookmark.platform} />
        <span className="text-xs text-zinc-500">{bookmark.messageCount} messages</span>
      </div>

      <h3 className="mt-3 font-semibold line-clamp-1">{bookmark.title || "Untitled"}</h3>
      <p className="mt-2 text-sm text-zinc-600 line-clamp-3">{preview}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{bookmark.wordCount} words</span>
        <Link href={`/bookmarks/${bookmark.id}`} className="text-xs font-semibold text-[var(--brand)]">
          Open
        </Link>
      </div>
    </article>
  );
}
