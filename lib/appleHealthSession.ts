import { cookies } from "next/headers";
import { createHash, randomUUID } from "crypto";

const SESSION_COOKIE = "apple_health_session";

export interface AppleHealthSession {
  // Random, generated at import time — carries no identity of its own (not derived from any
  // health or profile data), only exists to give getAppleUserKey() something stable to hash.
  // Mirrors what session.ts's refreshToken does for the Google path.
  id: string;
  age: number;
  restingHeartRate: number;
  oxygenPercentage: number | null;
  importedAt: number;
}

/** Same pattern as session.ts's getUserKey() — a one-way hash, never the id itself. */
export function getAppleUserKey(session: AppleHealthSession): string {
  return createHash("sha256").update(session.id).digest("hex").slice(0, 16);
}

export async function getAppleSession(): Promise<AppleHealthSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppleHealthSession;
  } catch {
    return null;
  }
}

export async function setAppleSession(
  data: Pick<AppleHealthSession, "age" | "restingHeartRate" | "oxygenPercentage">
): Promise<AppleHealthSession> {
  const session: AppleHealthSession = { ...data, id: randomUUID(), importedAt: Date.now() };
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return session;
}

export async function clearAppleSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
