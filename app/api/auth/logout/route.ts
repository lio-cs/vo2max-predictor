import { NextResponse } from "next/server";
import { getSession, getUserKey, clearSession } from "@/lib/session";
import { getAppleSession, getAppleUserKey, clearAppleSession } from "@/lib/appleHealthSession";
import { deleteUserLogs } from "@/lib/coachLog";

// See app/api/auth/callback/route.ts for why this doesn't use request.url — behind Cloud Run's
// proxy it reflects the container's internal bind address, not the real public host.
function getAppOrigin(): string {
  const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("Missing required env var: GOOGLE_HEALTH_REDIRECT_URI");
  }
  return new URL(redirectUri).origin;
}

export async function GET() {
  // Disconnecting is the actual data-retention mechanism (see app/privacy/page.tsx's "Data
  // retention" section) — it has to delete the stored coaching history, not just clear the
  // session cookie. Needs the session read first (to compute the same hashed key it was logged
  // under) before clearing it. A deletion failure shouldn't block the user from disconnecting,
  // so it's logged rather than thrown.
  const [googleSession, appleSession] = await Promise.all([getSession(), getAppleSession()]);

  try {
    if (googleSession) await deleteUserLogs(getUserKey(googleSession));
    if (appleSession) await deleteUserLogs(getAppleUserKey(appleSession));
  } catch (err) {
    console.error("Failed to delete coaching history on disconnect:", err);
  }

  await clearSession();
  await clearAppleSession();
  return NextResponse.redirect(`${getAppOrigin()}/`);
}
