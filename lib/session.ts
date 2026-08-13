import { cookies } from "next/headers";

const SESSION_COOKIE = "google_health_session";

export interface GoogleHealthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
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
