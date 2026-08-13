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
export async function getValidSession(): Promise<GoogleHealthSession | null> {
  const session = await getSession();
  if (!session) return null;

  const oneMinute = 60_000;
  if (Date.now() < session.expiresAt - oneMinute) {
    return session;
  }

  try {
    const refreshed = await refreshTokens(session.refreshToken);
    await setSession(refreshed);
    return refreshed;
  } catch {
    await clearSession();
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
