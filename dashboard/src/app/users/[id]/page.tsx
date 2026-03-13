"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUser } from "@/lib/cloudSync";
import {
  deletePublication,
  followUser,
  getProfile,
  getPublicationsByUser,
  isFollowing,
  updateProfile,
  unfollowUser,
  type Profile,
  type Publication
} from "@/lib/social";

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const profileId = String(params.id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [following, setFollowing] = useState(false);
  const [message, setMessage] = useState("");
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [draftBio, setDraftBio] = useState("");

  useEffect(() => {
    getProfile(profileId).then(setProfile);
    getPublicationsByUser(profileId).then(setPublications);

    getAuthenticatedUser().then(async (user) => {
      setViewerId(user?.id || null);
      if (!user || user.id === profileId) {
        setFollowing(false);
        return;
      }
      const result = await isFollowing(user.id, profileId);
      setFollowing(result);
    });
  }, [profileId]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDraftDisplayName(profile.display_name || profile.username || "");
    setDraftBio(profile.bio || "");
  }, [profile]);

  async function toggleFollow() {
    setMessage("");
    const user = await getAuthenticatedUser();
    if (!user) {
      setMessage("Sign in first to follow users.");
      return;
    }

    try {
      if (following) {
        await unfollowUser(user.id, profileId);
        setFollowing(false);
      } else {
        await followUser(user.id, profileId);
        setFollowing(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Follow action failed.");
    }
  }

  async function saveProfile() {
    if (!viewerId || viewerId !== profileId) {
      return;
    }

    try {
      await updateProfile({
        id: profileId,
        display_name: draftDisplayName.trim() || null,
        bio: draftBio.trim() || null
      });
      const latest = await getProfile(profileId);
      setProfile(latest);
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
    }
  }

  async function removePublication(publicationId: string) {
    try {
      await deletePublication(publicationId);
      const latest = await getPublicationsByUser(profileId);
      setPublications(latest);
      setMessage("Publication deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  const isOwnProfile = viewerId === profileId;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{profile?.display_name || profile?.username || "User"}</h1>
          <p className="text-sm text-zinc-500 mt-1">{profile?.bio || "No bio yet."}</p>
          <p className="text-xs text-zinc-500 mt-2">
            {profile?.follower_count || 0} followers · {profile?.following_count || 0} following · {profile?.publication_count || publications.length} posts
          </p>
        </div>
        <button
          onClick={isOwnProfile ? undefined : toggleFollow}
          className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
        >
          {isOwnProfile ? "Your profile" : following ? "Unfollow" : "Follow"}
        </button>
      </div>

      {isOwnProfile ? (
        <section className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">Edit profile</h2>
          <div className="mt-3 grid gap-2">
            <input
              value={draftDisplayName}
              onChange={(event) => setDraftDisplayName(event.target.value)}
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
              placeholder="Display name"
            />
            <textarea
              value={draftBio}
              onChange={(event) => setDraftBio(event.target.value)}
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm min-h-24"
              placeholder="Bio"
            />
            <div>
              <button onClick={saveProfile} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">
                Save profile
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {message ? <p className="mt-3 text-xs text-zinc-500">{message}</p> : null}

      <section className="mt-6 grid gap-3">
        {publications.map((publication) => (
          <article key={publication.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{publication.title}</h2>
              {isOwnProfile ? (
                <button
                  onClick={() => removePublication(publication.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700"
                >
                  Delete
                </button>
              ) : null}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{publication.platform} · {publication.category || "uncategorized"}</p>
            <p className="text-sm text-zinc-600 mt-3 line-clamp-3">{publication.messages?.[0]?.content || "No preview"}</p>
          </article>
        ))}
      </section>

      <div className="mt-8">
        <Link href="/feed" className="text-sm text-[var(--brand)] font-semibold">
          Back to feed
        </Link>
      </div>
    </main>
  );
}
