import { getGameDetail } from "@/lib/games";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const game = await getGameDetail(slug);

  if (!game) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }

  return Response.json({ game });
}
