"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { ensureProfile } from "@/lib/social";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finalizing sign-in...");

  useEffect(() => {
    async function completeAuth() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setMessage("Supabase is not configured. Add env values and try again.");
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (!code) {
        setMessage("Missing OAuth code. Please retry login.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        router.replace(`/auth/error?message=${encodeURIComponent(error.message)}`);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await ensureProfile(data.user);
      }

      router.replace("/");
    }

    completeAuth();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
        <h1 className="text-xl font-bold">ContextDrop Auth</h1>
        <p className="text-sm text-zinc-500 mt-2">{message}</p>
      </section>
    </main>
  );
}
