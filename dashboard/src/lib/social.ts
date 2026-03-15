import { getSupabaseClient } from "@/lib/supabase";
import type { Bookmark } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type Publication = {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  messages: Bookmark["messages"];
  category: string | null;
  upvote_count: number;
  view_count: number;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count?: number;
  following_count?: number;
  publication_count?: number;
};

export async function publishBookmark(userId: string, bookmark: Bookmark, category: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { error } = await supabase.from("publications").insert({
    user_id: userId,
    title: bookmark.title || "Untitled",
    platform: bookmark.platform,
    messages: bookmark.messages,
    category: category || null
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deletePublication(publicationId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { error } = await supabase.from("publications").delete().eq("id", publicationId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getPublications(category?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [] as Publication[];
  }

  let query = supabase
    .from("publications")
    .select("*")
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [] as Publication[];
  }

  return data as Publication[];
}

export async function upvotePublication(publicationId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await supabase.rpc("upvote_publication", {
    p_publication_id: publicationId
  });

  if (error) {
    throw new Error(error.message);
  }

  const resultRow = Array.isArray(data) ? data[0] : null;
  if (!resultRow?.applied) {
    throw new Error("You have already upvoted this publication.");
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export async function getPublicationsByUser(userId: string): Promise<Publication[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return data as Publication[];
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function followUser(followerId: string, followingId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  void followerId;
  const { data, error } = await supabase.rpc("follow_user", { p_following_id: followingId });
  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.applied) {
    throw new Error("Already following this user.");
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  void followerId;
  const { data, error } = await supabase.rpc("unfollow_user", { p_following_id: followingId });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.applied) {
    throw new Error("You are not following this user.");
  }
}

export async function ensureProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const metadataName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  const metadataAvatar = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const fallbackName = (user.email || "user").split("@")[0] || "user";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: fallbackName,
      display_name: metadataName || fallbackName,
      avatar_url: metadataAvatar,
      bio: null
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProfile(profile: {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio
    })
    .eq("id", profile.id);

  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeToPublicationChanges(onChange: () => void): RealtimeChannel | null {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const channel = supabase
    .channel("publications-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "publications" },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "upvotes" },
      () => onChange()
    )
    .subscribe();

  return channel;
}

export function unsubscribeChannel(channel: RealtimeChannel | null) {
  const supabase = getSupabaseClient();
  if (!supabase || !channel) {
    return;
  }

  supabase.removeChannel(channel);
}

export function subscribeToFollowingFeedChanges(onChange: () => void): RealtimeChannel | null {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const channel = supabase
    .channel("following-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "publications" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, onChange)
    .subscribe();

  return channel;
}

export async function getFollowingFeed(userId: string): Promise<Publication[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data: followsData, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (followsError || !followsData?.length) {
    return [];
  }

  const followingIds = followsData.map((row) => row.following_id);

  const { data: publicationsData, error: publicationsError } = await supabase
    .from("publications")
    .select("*")
    .in("user_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (publicationsError || !publicationsData) {
    return [];
  }

  return publicationsData as Publication[];
}
