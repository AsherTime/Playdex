import { getLatestNews } from "@/lib/news";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ news: await getLatestNews() });
}
