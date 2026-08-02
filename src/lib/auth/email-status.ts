export type AuthEmailStatus = "confirmed" | "unconfirmed" | "not_found";

export type AuthEmailStatusResponse = {
  status: AuthEmailStatus;
  exists: boolean;
};

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function checkAuthEmailStatus(email: string): Promise<AuthEmailStatusResponse> {
  const response = await fetch("/api/auth/email-status", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email: normalizeAuthEmail(email) }),
  });

  const payload = (await response.json().catch(() => null)) as
    | (Partial<AuthEmailStatusResponse> & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Could not check that email right now.");
  }

  if (
    payload?.status !== "confirmed" &&
    payload?.status !== "unconfirmed" &&
    payload?.status !== "not_found"
  ) {
    throw new Error("Could not check that email right now.");
  }

  return {
    status: payload.status,
    exists: payload.exists ?? payload.status !== "not_found",
  };
}
