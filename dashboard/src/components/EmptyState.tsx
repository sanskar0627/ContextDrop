export function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-10 text-center">
      <h2 className="text-lg font-semibold">No bookmarks yet</h2>
      <p className="mt-2 text-sm text-zinc-500">Open an AI conversation and click the ContextDrop floating button to save it.</p>
    </section>
  );
}
