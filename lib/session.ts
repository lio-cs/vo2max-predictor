import { cookies } from "next/headers";
import { createHash } from "crypto";

const SESSION_COOKIE = "google_health_session";

export interface GoogleHealthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

/**
 * A stable-per-user, non-identifying key for scoping storage (Firestore logs, etc.) — derived
 * from the refresh token rather than any profile data, so it stays consistent for the same
 * user across sessions without ever storing or deriving anything from their name/email. The
 * refresh token itself is never stored anywhere this key touches, only its one-way hash.
 */
export function getUserKey(session: GoogleHealthSession): string {
  return createHash("sha256").update(session.refreshToken).digest("hex").slice(0, 16);
}

export async function getSession(): Promise<GoogleHealthSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GoogleHealthSession;
  } catch {
    return null;
  }
}

export async function setSession(session: GoogleHealthSession): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Google's refresh token itself expires (7 days while the OAuth consent
    // screen is in Testing mode); the cookie just needs to outlive that.
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
