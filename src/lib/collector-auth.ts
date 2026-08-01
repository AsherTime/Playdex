/**
 * Protects scheduled collector HTTP routes.
 * Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
 */
export function verifyCollectorCronRequest(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
      return Response.json(
        { error: "CRON_SECRET is not configured for collector routes." },
        { status: 503 },
      );
    }
    return null;
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
