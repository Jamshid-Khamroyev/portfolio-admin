import { create } from "zustand";
import { BlogPost } from "@/lib/data-store";

type BlogsUpdater = BlogPost[] | ((prev: BlogPost[]) => BlogPost[]);

interface BlogStore {
  blogs: BlogPost[];
  /** Bir marta serverdan yuklangandan keyin `true` — qayta yuklash shart emas */
  loaded: boolean;
  setBlogs: (updater: BlogsUpdater) => void;
}

/**
 * Admin panelning "Bloglar" sahifasi uchun sessiya-ichi kesh.
 *
 * Foydalanuvchi shu sahifaga birinchi kirganda serverdan yuklanadi,
 * keyin boshqa bo'limga o'tib qaytib kelsa — qayta so'rov yubormasdan
 * shu yerdagi holatdan (state) ko'rsatiladi. Sahifa to'liq qayta
 * yuklansa (F5) — kesh ham tozalanadi, bu normal (Zustand xotirada
 * saqlanadi, localStorage'da emas).
 */
export const useBlogStore = create<BlogStore>((set) => ({
  blogs: [],
  loaded: false,
  setBlogs: (updater) =>
    set((state) => ({
      blogs: typeof updater === "function" ? updater(state.blogs) : updater,
      loaded: true,
    })),
}));
