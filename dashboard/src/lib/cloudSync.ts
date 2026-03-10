import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import type { Bookmark } from "@/lib/types";

type CloudBookmarkRow = {
  id: string;
  user_id: string;
  platform: string;
  title: string;
  url: string | null;
  messages: unknown;
  message_count: number;
  word_count: number;
  tags: string[];
  custom_tags: string[];
  created_at: string;
  updated_at: string;
};

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function syncBookmarksToCloud(userId: string, bookmarks: Bookmark[]) {
  const supabase = getSupabaseClient();
  if (!supabase || !bookmarks.length) {
    return;
  }

  const rows = bookmarks.map((bookmark) => ({
    id: bookmark.id,
    user_id: userId,
    platform: bookmark.platform,
    title: bookmark.title || "Untitled",
    url: bookmark.url || null,
    messages: bookmark.messages,
    message_count: bookmark.messageCount || bookmark.messages.length,
    word_count: bookmark.wordCount || 0,
    tags: bookmark.tags || [],
    custom_tags: bookmark.customTags || [],
    created_at: bookmark.createdAt,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase.from("bookmarks").upsert(rows, { onConflict: "id" });
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCloudBookmarks(userId: string): Promise<Bookmark[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as CloudBookmarkRow[]).map((row) => ({
    id: row.id,
    platform: row.platform as Bookmark["platform"],
    title: row.title,
    url: row.url || "",
    messages: Array.isArray(row.messages) ? (row.messages as Bookmark["messages"]) : [],
    messageCount: row.message_count,
    wordCount: row.word_count,
    tags: row.tags || [],
    customTags: row.custom_tags || [],
    createdAt: row.created_at
  }));
}
