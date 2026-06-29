import { getLatestNewsForGame } from "@/lib/news";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const news = await getLatestNewsForGame(slug);

  return Response.json({ news });
}
