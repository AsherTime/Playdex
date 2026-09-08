import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

let lastSessionRefreshWarningAt = 0;

function hasSupabaseAuthCookie(request: NextRequest, supabaseUrl: string) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const authCookiePrefix = `sb-${projectRef}-auth-token`;

  return request.cookies
    .getAll()
    .some((cookie) => cookie.name === authCookiePrefix || cookie.name.startsWith(`${authCookiePrefix}.`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  if (!hasSupabaseAuthCookie(request, supabaseUrl)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (error) {
    const now = Date.now();
    if (now - lastSessionRefreshWarningAt > 60_000) {
      lastSessionRefreshWarningAt = now;
      console.warn("Supabase session refresh skipped:", error instanceof Error ? error.message : error);
    }
  }

  return supabaseResponse;
}
