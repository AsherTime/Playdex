import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/auth-server";
import type { Database } from "@/types/database";

export type AppRole = Database["public"]["Tables"]["profiles"]["Row"]["app_role"];

export type AuthzUser = {
  id: string;
  email: string | null;
  role: AppRole;
  name: string | null;
};

export async function getCurrentUserWithRole(): Promise<AuthzUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_role, name, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? null,
    role: profile?.app_role ?? "user",
    name: profile?.name ?? null,
  };
}

export async function requireGuideWriter(): Promise<AuthzUser> {
  const user = await getCurrentUserWithRole();
  if (!user || !["writer", "admin"].includes(user.role)) {
    throw new Error("Writer access required.");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthzUser> {
  const user = await getCurrentUserWithRole();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return user;
}

export function canEditGuides(role: AppRole | null | undefined) {
  return role === "writer" || role === "admin";
}
