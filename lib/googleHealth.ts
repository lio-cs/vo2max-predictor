import { clearSession, getSession, setSession, type GoogleHealthSession } from "./session";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://health.googleapis.com/v4";

const SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.profile.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_HEALTH_CLIENT_ID"),
    redirect_uri: requireEnv("GOOGLE_HEALTH_REDIRECT_URI"),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES.join(" "),
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

function tokenResponseToSession(tokens: TokenResponse, previousRefreshToken?: string): GoogleHealthSession {
  const refreshToken = tokens.refresh_token ?? previousRefreshToken;
  if (!refreshToken) {
    throw new Error("Google did not return a refresh token and none was already stored.");
  }
  return {
    accessToken: tokens.access_token,
    refreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleHealthSession> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: requireEnv("GOOGLE_HEALTH_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_HEALTH_CLIENT_SECRET"),
      redirect_uri: requireEnv("GOOGLE_HEALTH_REDIRECT_URI"),
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }
  return tokenResponseToSession(await res.json());
}

async function refreshTokens(refreshToken: string): Promise<GoogleHealthSession> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: requireEnv("GOOGLE_HEALTH_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_HEALTH_CLIENT_SECRET"),
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }
  return tokenResponseToSession(await res.json(), refreshToken);
}

/**
 * Returns a session with a non-expired access token, transparently
 * refreshing (and persisting) it when needed. Clears the session if the
 * refresh token itself is no longer valid (e.g. the 7-day expiry Google
 * applies while the OAuth consent screen is in Testing mode), so the UI
 * falls back to prompting reconnection instead of showing a raw error.
 */
/**
 * setSession/clearSession write cookies, which Next.js only allows inside a Server Action or
 * Route Handler — not while a Server Component is rendering (e.g. page.tsx loading `/`
 * directly). getValidSession() is called from both contexts, so a refresh/clear triggered
 * during a plain page render would otherwise crash the render entirely. Swallow *only* that
 * specific, well-known Next.js error: the in-memory session result below is still correct for
 * the current request either way, and the cookie gets properly persisted the next time a
 * Route Handler runs (e.g. /api/coach, /api/vo2max).
 */
async function safelyPersistSession(mutate: () => Promise<void>): Promise<void> {
  try {
    await mutate();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.startsWith("Cookies can only be modified")) {
      return;
    }
    throw e;
  }
}

export async function getValidSession(): Promise<GoogleHealthSession | null> {
  const session = await getSession();
  if (!session) return null;

  const oneMinute = 60_000;
  if (Date.now() < session.expiresAt - oneMinute) {
    return session;
  }

  try {
    const refreshed = await refreshTokens(session.refreshToken);
    await safelyPersistSession(() => setSession(refreshed));
    return refreshed;
  } catch {
    await safelyPersistSession(() => clearSession());
    return null;
  }
}

async function healthFetch(session: GoogleHealthSession, path: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
}

interface ProfileResponse {
  age?: number;
}

export async function getAge(session: GoogleHealthSession): Promise<number | null> {
  const res = await healthFetch(session, "/users/me/profile");
  if (!res.ok) {
    throw new Error(`Google Health profile fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as ProfileResponse;
  return data.age ?? null;
}

interface DailyRestingHeartRateDataPoint {
  dailyRestingHeartRate?: {
    date?: { year: number; month: number; day: number };
    beatsPerMinute?: number | string;
  };
}

interface DataPointsResponse {
  dataPoints?: DailyRestingHeartRateDataPoint[];
}

/**
 * Most recent daily resting heart rate reading, or null if Fitbit hasn't
 * calculated one yet. Per Google's docs, dataPoints responses are ordered by
 * interval start time in DESCENDING order (most recent first), so the
 * latest reading is points[0], not the last element. The exact response
 * shape for this data type isn't otherwise fully nailed down in Google's
 * public docs yet (this API is very new), so this throws a descriptive
 * error with the raw payload if the expected field is missing rather than
 * failing silently.
 */
export async function getLatestRestingHeartRate(session: GoogleHealthSession): Promise<number | null> {
  const res = await healthFetch(
    session,
    "/users/me/dataTypes/daily-resting-heart-rate/dataPoints?pageSize=7"
  );
  if (!res.ok) {
    throw new Error(`Google Health heart rate fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as DataPointsResponse;
  const points = data.dataPoints ?? [];
  if (points.length === 0) return null;

  const latest = points[0];
  const bpm = latest.dailyRestingHeartRate?.beatsPerMinute;
  if (bpm == null) {
    throw new Error(
      `Unexpected daily-resting-heart-rate response shape: ${JSON.stringify(latest)}`
    );
  }
  return Number(bpm);
}

interface DailyOxygenSaturationDataPoint {
  dailyOxygenSaturation?: {
    date?: { year: number; month: number; day: number };
    averagePercentage?: number | string;
  };
}

interface OxygenDataPointsResponse {
  dataPoints?: DailyOxygenSaturationDataPoint[];
}

/**
 * Most recent daily average blood oxygen saturation (SpO2), or null if unavailable — many
 * Fitbit models don't support this at all. Same descending-order assumption as resting heart
 * rate (confirmed general behavior of this API), same defensive throw-on-mismatch: the exact
 * field name here is inferred from Google's proto definition (DailyOxygenSaturation ->
 * average_percentage, converted to camelCase per standard proto3 JSON mapping) since the REST
 * docs don't show a worked example — not yet confirmed against a real live response.
 */
export async function getLatestOxygenSaturation(session: GoogleHealthSession): Promise<number | null> {
  const res = await healthFetch(
    session,
    "/users/me/dataTypes/daily-oxygen-saturation/dataPoints?pageSize=7"
  );
  if (!res.ok) {
    throw new Error(`Google Health oxygen saturation fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as OxygenDataPointsResponse;
  const points = data.dataPoints ?? [];
  if (points.length === 0) return null;

  const latest = points[0];
  const percentage = latest.dailyOxygenSaturation?.averagePercentage;
  if (percentage == null) {
    throw new Error(
      `Unexpected daily-oxygen-saturation response shape: ${JSON.stringify(latest)}`
    );
  }
  return Number(percentage);
}
