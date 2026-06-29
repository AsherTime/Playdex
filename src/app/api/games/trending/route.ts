import { getTrendingGames } from "@/lib/games";

export async function GET() {
  return Response.json({ games: getTrendingGames() });
}
