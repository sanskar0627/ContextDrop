"use client";

import { useMemo, useState, useEffect } from "react";
import {
  getCompareSessions,
  recordCompareResult,
  type CompareSession
} from "@/lib/bridge";

type Filter = "all" | "pending" | "resolved";

function toJsonDownload(content: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CompareResultsPage() {
  const [sessions, setSessions] = useState<CompareSession[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getCompareSessions().then(setSessions);
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((session) => {
      if (filter === "pending" && session.winnerPlatform) {
        return false;
      }
      if (filter === "resolved" && !session.winnerPlatform) {
        return false;
      }

      const q = query.trim().toLowerCase();
      if (!q) {
        return true;
      }

      const haystack = `${session.title} ${session.primaryPlatform} ${session.secondaryPlatform}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [sessions, filter, query]);

  async function markWinner(session: CompareSession, winnerPlatform: string) {
    const ok = await recordCompareResult(session.id, winnerPlatform);
    if (!ok) {
      return;
    }

    const latest = await getCompareSessions();
    setSessions(latest);
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Compare Results</h1>
          <p className="text-zinc-500 mt-1">Review side-by-side AI compare sessions and record winners.</p>
        </div>
        <button
          onClick={() => toJsonDownload(filtered, `chathop-compare-${Date.now()}.json`)}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
        >
          Export JSON
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "pending", "resolved"] as Filter[]).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full px-3 py-1 text-xs border ${filter === item ? "border-[var(--brand)] bg-orange-50" : "border-[var(--line)] bg-white"}`}
          >
            {item}
          </button>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or platform"
          className="ml-auto rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs"
        />
      </div>

      <section className="mt-6 grid gap-3">
        {filtered.map((session) => (
          <article key={session.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold line-clamp-1">{session.title}</h2>
              <span className="text-xs text-zinc-500">{new Date(session.createdAt).toLocaleString()}</span>
            </div>

            <p className="text-xs text-zinc-500 mt-2">
              {session.primaryPlatform} vs {session.secondaryPlatform} · mode: {session.mode}
            </p>

            {session.winnerPlatform ? (
              <p className="mt-3 text-xs text-emerald-700">Winner: {session.winnerPlatform}</p>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => markWinner(session, session.primaryPlatform)}
                  className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-xs"
                >
                  {session.primaryPlatform} won
                </button>
                <button
                  onClick={() => markWinner(session, session.secondaryPlatform)}
                  className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-xs"
                >
                  {session.secondaryPlatform} won
                </button>
              </div>
            )}
          </article>
        ))}

        {!filtered.length ? <p className="text-sm text-zinc-500">No compare sessions found.</p> : null}
      </section>
    </main>
  );
}
