import type { GamePost } from "@/types/gamedex";
import { EditorialPostCard } from "@/components/editorial-post-card";

export function PostCard({ post }: { post: GamePost }) {
  return <EditorialPostCard post={post} />;
}
