interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: TagPageProps) {
  const resolved = await params;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-bold">Tag: {decodeURIComponent(resolved.tag)}</h1>
      <p className="text-zinc-500 mt-1">Tag-specific filtering is supported in the extension dashboard now and can be fully wired to this route in Phase 2 cloud mode.</p>
    </main>
  );
}
