"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import { ensureProfile } from "@/lib/social";

export function AuthBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        await ensureProfile(data.user);
      }
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureProfile(session.user);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="text-xs text-zinc-500">Checking session...</div>;
  }

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-600">{user.email}</span>
      <button
        onClick={signOut}
        className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
      >
        Sign out
      </button>
    </div>
  );
}
