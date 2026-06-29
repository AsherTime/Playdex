import { NewsCard } from "@/components/news-card";
import { SectionHeader } from "@/components/section-header";
import { getLatestNews } from "@/lib/news";

export default async function NewsPage() {
  const latestNews = await getLatestNews();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Feed"
        title="Latest Gaming News"
        description="Curated story cards shaped for trend analysis rather than endless scrolling."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {latestNews.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
