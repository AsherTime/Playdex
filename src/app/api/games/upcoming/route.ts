import { getUpcomingGames } from "@/lib/games";

export async function GET() {
  return Response.json({ games: getUpcomingGames() });
}
