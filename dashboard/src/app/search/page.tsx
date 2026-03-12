"use client";

import { useEffect, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { BookmarksGrid } from "@/components/BookmarksGrid";
import { searchBookmarks } from "@/lib/bridge";
import type { Bookmark } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Bookmark[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    searchBookmarks(query).then(setResults);
  }, [query]);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-bold">Search</h1>
      <p className="text-zinc-500 mt-1">Find context across all saved AI conversations.</p>
      <div className="mt-4 max-w-2xl">
        <SearchBar value={query} onChange={setQuery} />
      </div>
      <div className="mt-6">
        <BookmarksGrid bookmarks={results} />
      </div>
    </main>
  );
}
