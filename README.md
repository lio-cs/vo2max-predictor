# VO2 Max Predictor

Estimates your VO2max (cardiorespiratory fitness) from your Fitbit's resting heart rate and
age — no manual data entry, no lab test required. Built with Next.js (App Router).

Fitbit data is accessed through the **Google Health API** (`health.googleapis.com`), which is
replacing the legacy Fitbit Web API (sunsetting September 2026).

## How it works

VO2max is estimated with the **Uth–Sørensen–Overgaard–Pedersen** non-exercise formula:

```
HRmax  = 208 - 0.7 x age              (Tanaka et al. estimated max heart rate)
VO2max = 15.3 x (HRmax / HRresting)
```

Age and resting heart rate both come from the Google Health API. This is an estimate — most
accurate for moderately fit adults, and not a substitute for a lab-measured VO2max test.

## 1. Set up a Google Cloud OAuth client

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create (or select)
   a project.
2. Under **APIs & Services → Library**, search for and enable the **Google Health API**.
3. Under **APIs & Services → OAuth consent screen**:
   - Keep **Publishing status** as **Testing** (this app is for personal use only — going to
     Production requires a Google privacy/security review since these are Restricted scopes).
   - Add yourself under **Test users**.
   - On the **Data Access** tab, add these two scopes:
     - `https://www.googleapis.com/auth/googlehealth.profile.readonly`
     - `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`
4. Under **APIs & Services → Credentials**, create an **OAuth client ID**:
   - **Application type**: `Web server` (called "Web application" in some parts of the console)
   - **Authorized redirect URI**: `http://localhost:3000/api/auth/callback`
5. Copy the **Client ID** and **Client Secret** shown after creation.

> **Note:** while the consent screen is in Testing mode, Google's refresh tokens for this app
> expire after 7 days — you'll need to reconnect periodically. This is a Google limitation, not
> a bug in the app.

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

```
GOOGLE_HEALTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_HEALTH_CLIENT_SECRET=your_client_secret
GOOGLE_HEALTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## 3. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Connect Google Health**, and
authorize the app. You'll be redirected back with your estimated VO2max.

## AeroCoach (Gemini XPRIZE practice build)

This app also has a small Gemini-powered coaching layer bolted on top of the VO2max estimate,
built as **practice for the [Build with Gemini XPRIZE](https://www.geminixprize.com/)** — not
an actual competition submission (there wasn't enough runway left before the Aug 17, 2026
deadline to hit the real bar: verified revenue, real customers, financial evidence, etc.). The
goal here is just to get hands-on with the required tech (a live Gemini API call + a Google
Cloud product driving an actual product decision) using this repo's real VO2max pipeline instead
of a throwaway toy.

The product targets **obstructive sleep apnea (OSA)** screening, not general cardiometabolic
risk (an earlier framing this repo briefly had before the team reconciled on OSA — see
`AEROCOACH_PLAN.md`). **What it adds**, entirely on top of the existing `computeVo2Max()`
pipeline:

- `lib/riskTrajectory.ts` — STOP-BANG questionnaire scoring (a validated 8-item OSA screening
  tool) drives the risk tier. VO2max trend is computed separately as general fitness context —
  **it does not feed into the OSA risk tier**, since fitness level isn't validated evidence for
  OSA specifically. **STOP-BANG is a screening tool, not a diagnosis — only a real sleep study
  can diagnose OSA.**
- `lib/geminiCoach.ts` — calls the Gemini API (`gemini-3.5-flash-lite` by default, traced via
  LangFuse) for the plain-English translation layer only — risk explanation, action rationale,
  motivational nudge. The recommended action (monitor / mention to doctor / see doctor soon) is
  decided deterministically in code from the STOP-BANG tier, never by the model. Output is
  validated (non-empty, length-bounded) before use, and the system prompt includes basic
  guardrails against prompt injection.
- `lib/coachLog.ts` — logs each day's coaching decision to Firestore (Google Cloud's Always
  Free tier covers this at real-world practice volume). No-ops gracefully if Firestore isn't
  configured yet, so the rest of the app still works.
- `app/api/coach/route.ts` — a POST route accepting the 8 STOP-BANG answers, rate-limited
  (10 req/min per client) to guard against abuse and free-tier quota exhaustion.
- `app/StopBangForm.tsx` — the client-side questionnaire + results panel on the home page.

**To enable it:** add `GEMINI_API_KEY` to `.env.local` (free at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey)) and run `npm install`.
Firestore logging and LangFuse tracing are both optional — see `.env.local.example` for the
extra vars.

### Running with Docker

```bash
docker build -t aerocoach .
docker run -p 3000:3000 --env-file .env.local aerocoach
```

Uses Next.js's `output: "standalone"` build to keep the image minimal — see `Dockerfile`.

## Notes

- Tokens are stored in an httpOnly session cookie for this single-user, local setup. If you
  ever deploy this publicly, encrypt/sign the cookie (e.g. with `iron-session`) first, and note
  that publishing the OAuth consent screen out of Testing mode requires Google's review since
  these are Restricted scopes.
- Google access tokens expire hourly; the app refreshes them automatically and persists the
  rotated refresh token. If the refresh token itself has expired (see the 7-day Testing-mode
  note above), the app clears the session and prompts you to reconnect.
- The Google Health API is very new; if `daily-resting-heart-rate` responses don't match the
  shape `lib/googleHealth.ts` expects, `getLatestRestingHeartRate` throws with the raw JSON
  payload included in the error message so the parsing can be corrected against the real
  response.
