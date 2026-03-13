"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCompareSessions,
  getHopHistory,
  recordCompareResult,
  type CompareSession,
  type HopEvent
} from "@/lib/bridge";

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

export default function StatsPage() {
  const [history, setHistory] = useState<HopEvent[]>([]);
  const [compareSessions, setCompareSessions] = useState<CompareSession[]>([]);

  useEffect(() => {
    getHopHistory().then(setHistory);
    getCompareSessions().then(setCompareSessions);
  }, []);

  const byTarget = useMemo(
    () => countBy(history.map((event) => event.to || "unknown")),
    [history]
  );

  const byMode = useMemo(
    () => countBy(history.map((event) => event.mode || "unknown")),
    [history]
  );

  const topTargets = Object.entries(byTarget).sort((a, b) => b[1] - a[1]);
  const topModes = Object.entries(byMode).sort((a, b) => b[1] - a[1]);

  const compareWinners = useMemo(
    () => countBy(compareSessions.filter((session) => session.winnerPlatform).map((session) => session.winnerPlatform as string)),
    [compareSessions]
  );

  const unresolvedCompareSessions = compareSessions.filter((session) => !session.winnerPlatform).slice(0, 10);

  async function handleWinner(sessionId: string, winnerPlatform: string) {
    await recordCompareResult(sessionId, winnerPlatform);
    const latest = await getCompareSessions();
    setCompareSessions(latest);
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-bold">Personal Stats</h1>
      <p className="text-zinc-500 mt-1">How you route prompts across AI platforms.</p>

      <section className="mt-6 grid md:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Total hops</p>
          <p className="text-3xl font-bold mt-2">{history.length}</p>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 md:col-span-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Most used target</p>
          <p className="text-2xl font-bold mt-2">{topTargets[0]?.[0] || "No data"}</p>
          <p className="text-sm text-zinc-500 mt-1">{topTargets[0]?.[1] || 0} hops</p>
        </article>
      </section>

      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">Targets</h2>
          <div className="mt-3 grid gap-2">
            {topTargets.map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between text-sm">
                <span className="capitalize">{platform}</span>
                <span className="text-zinc-500">{count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">Transfer Modes</h2>
          <div className="mt-3 grid gap-2">
            {topModes.map(([mode, count]) => (
              <div key={mode} className="flex items-center justify-between text-sm">
                <span className="capitalize">{mode}</span>
                <span className="text-zinc-500">{count}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">Compare Winners</h2>
          <div className="mt-3 grid gap-2">
            {Object.keys(compareWinners).length === 0 ? (
              <p className="text-sm text-zinc-500">No compare results recorded yet.</p>
            ) : (
              Object.entries(compareWinners)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{platform}</span>
                    <span className="text-zinc-500">{count}</span>
                  </div>
                ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">Pending Compare Feedback</h2>
          <div className="mt-3 grid gap-3">
            {unresolvedCompareSessions.length === 0 ? (
              <p className="text-sm text-zinc-500">No pending compare sessions.</p>
            ) : (
              unresolvedCompareSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-[var(--line)] p-3">
                  <p className="text-sm font-semibold line-clamp-1">{session.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {session.primaryPlatform} vs {session.secondaryPlatform}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleWinner(session.id, session.primaryPlatform)}
                      className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-xs"
                    >
                      {session.primaryPlatform} won
                    </button>
                    <button
                      onClick={() => handleWinner(session.id, session.secondaryPlatform)}
                      className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-xs"
                    >
                      {session.secondaryPlatform} won
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
