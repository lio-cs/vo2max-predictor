# AeroCoach — Dev tools

Companion to `AEROCOACH_PLAN.md`. Split by actual status, not aspiration — several tools below
are mentor-recommended but not yet adopted; don't treat this list as "what's installed."

---

## In use now (confirmed, $0 spend)

| Tool | Role |
|---|---|
| **Next.js 16** (React 19, TypeScript) | The actual app — `vo2max-predictor/` |
| **Google Health API** (`health.googleapis.com`) | Real Fitbit data (age, resting heart rate) via OAuth2 |
| **Gemini API** (via Google AI Studio) | The coaching LLM call — currently `gemini-3.5-flash-lite`, raw REST (no SDK) |
| **Firestore** (Google Cloud, free tier) | Logs every coaching decision — `lib/coachLog.ts`, no-ops until configured |
| **Tailwind CSS** | Styling for the `Coach` panel and the rest of the UI |
| **ESLint / TypeScript compiler** | Build-time checks — both currently clean |
| **Vitest** | Test runner ($0, added Aug 13) — 45 tests covering STOP-BANG scoring, rate limiting, output validation, and API input parsing. `npm test` |

**Where the keys/config come from:** `GEMINI_API_KEY` from [aistudio.google.com/apikey](https://aistudio.google.com/apikey); Firestore needs a GCP project + service account (Always Free tier covers it, but requires a billing account on file — see `AEROCOACH_PLAN.md` §7 budget notes). Full env var list in `.env.local.example`.

---

## Decided, not yet implemented

| Tool | Why | Status |
|---|---|---|
| **LangFuse** | LLM observability — Digvijay flagged this as important since Gemini token usage is non-linear and can quietly exhaust free-tier limits | Not wired in yet — open checklist item |
| **Docker** | Containerize the app so it runs the same for everyone on the team, no local dependency drift | Not started |

---

## Open decision — blocking further build work

**Stay TypeScript/Next.js, or introduce Python + LangChain?**

Digvijay's mentor recommendation was Python + **LangChain** (free/OSS agent framework with
Gemini support) for the agent layer. What's actually built is TypeScript/Next.js with a
hand-rolled REST call to Gemini — which is also the real, working AeroGlyphics product code.

Options on the table (see `AEROCOACH_PLAN.md` §3):
- (a) Keep Next.js, add LangFuse via its JS/TS SDK — no rewrite
- (b) Stand up a separate Python service for just the agent layer, called from Next.js
- (c) Adopt **LangChain.js** (the JS/TS port) instead of a Python rewrite, if the agent-framework
  abstraction is what matters more than the language itself

Not resolved — top priority item in the plan doc's checklist.

---

## Mentioned, not yet detailed

| Tool | What we know | Blocked on |
|---|---|---|
| **Workalyzer** | Suggested by Eangelica for Fitbit↔Gemini integration | Link was going to be posted to WhatsApp, not yet received |
| Unnamed **safety/guardrails API** | Also from Eangelica, for prompt-injection/abuse protection | Same — link pending |
| **Airflow / DAGs** | Digvijay's suggestion, but explicitly conditional: "only if data is tabular or in Excel sheets" | Not committed — doesn't apply to the current wearable-data pipeline |

---

## Available in the Gemini/Google AI stack, not currently used

Worth knowing about, not required for what's built so far:

- **Vertex AI** — the enterprise version of the Gemini API, with built-in usage
  dashboards/logging. Could replace the hand-rolled Firestore logging for the "execution
  logs / API usage" evidence the hackathon rules ask for, if judges want closer to real
  Google Cloud infra.
- **Google AI Studio** — already the source of the free API key; also useful for prototyping
  prompts before pasting into `lib/geminiCoach.ts`.
- **Stitch** (Google's AI UI-design tool) — could speed up Jyrah's UI/UX pass on the `Coach`
  panel.
- **Flow** (Google's AI video tool) — could help with the Day-4-equivalent demo video edit.
- **Antigravity** (Google's agentic coding tool, free plan) — an alternative dev environment;
  not needed since the team is building through Claude Code, but technically part of "the
  stack" if it comes up.

---

## Data / research assets (not tools, but adjacent)

- **Stanford sleep dataset** — open dataset Digvijay pointed to, to avoid building from scratch
- **`zou-group/sleepfm-clinical`** (forked as `eangelica2014/sleepfm-clinical`) — the real
  Stanford/Zou Group SleepFM research repo. ⚠️ Confirm the fork only contains code/model
  weights, not restricted PSG training data — the source paper's data-use terms prohibit
  redistribution (see `AEROCOACH_PLAN.md` §7)
- **Health Auto Export** — referenced in `Downloads/CLAUDE.md` as the planned path for
  ingesting Apple Watch HealthKit data (no direct cloud API exists for Apple Watch); not yet
  integrated into this repo, which currently only pulls Fitbit via Google Health API

---

## Registration / accounts

- **Gemini Prize platform** (Devpost-based XPRIZE registration) — ✅ registered Aug 10. Checked
  `xprize.devpost.com/resources` and the main page for a participant credit tier: **none is
  publicly documented** — just the standard $300/90-day Google Cloud free trial and
  Antigravity's $0/month plan, same as any new GCP account. Update this line if a bonus code
  shows up separately via email/Devpost account.
- **Hackathon registration itself** — ✅ completed Aug 10
