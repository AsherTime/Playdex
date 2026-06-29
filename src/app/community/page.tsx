import { PostCard } from "@/components/post-card";
import { SectionHeader } from "@/components/section-header";
import { getCommunityPosts } from "@/lib/content";

export default function CommunityPage() {
  const posts = getCommunityPosts();

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Conversation"
        title="Community"
        description="Curated opinion and player discourse, filtered to signal instead of volume."
      />
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
