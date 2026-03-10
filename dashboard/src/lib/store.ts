"use client";

import { create } from "zustand";
import type { Bookmark } from "./types";

interface BookmarkState {
  bookmarks: Bookmark[];
  setBookmarks: (bookmarks: Bookmark[]) => void;
}

export const useBookmarkStore = create<BookmarkState>((set) => ({
  bookmarks: [],
  setBookmarks: (bookmarks) => set({ bookmarks })
}));
