import { type NextRequest } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service-client";
import type { Database } from "@/types/database";

type AuthEmailStatus = Database["public"]["Functions"]["check_auth_email_status"]["Returns"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 12;
const attempts = new Map<string, { count: number; resetAt: number }>();

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function clientKey(request: NextRequest, email: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    forwardedFor ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown";
  return `${ip}:${email}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  if (current.count > MAX_ATTEMPTS) return true;
  return false;
}

function toResponse(status: AuthEmailStatus) {
  return Response.json({
    status,
    exists: status !== "not_found",
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = normalizeEmail((body as { email?: unknown }).email);
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (isRateLimited(clientKey(request, email))) {
    return Response.json(
      { error: "Too many checks. Wait a minute, then try again." },
      { status: 429 },
    );
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.rpc("check_auth_email_status", {
      check_email: email,
    });

    if (error) {
      console.error("Auth email status check failed", error);
      return Response.json({ error: "Could not check that email right now." }, { status: 500 });
    }

    if (data !== "confirmed" && data !== "unconfirmed" && data !== "not_found") {
      console.error("Unexpected auth email status", data);
      return Response.json({ error: "Could not check that email right now." }, { status: 500 });
    }

    return toResponse(data);
  } catch (error) {
    console.error("Auth email status route failed", error);
    return Response.json({ error: "Could not check that email right now." }, { status: 500 });
  }
}
