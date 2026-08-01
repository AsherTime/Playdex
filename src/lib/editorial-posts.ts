import { posts } from "@/data/mock-data";
import type { GamePost } from "@/types/gamedex";

export function getEditorialPosts(limit?: number): GamePost[] {
  const editorial = posts.filter((post) => post.isEditorial);
  return limit ? editorial.slice(0, limit) : editorial;
}
