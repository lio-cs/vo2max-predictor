# AeroCoach — Project Summary

**A clean, current-state reference — not a changelog.** For the full day-by-day history, decisions,
and reasoning behind everything below, see `AEROCOACH_PLAN.md`. Last updated Aug 18, 2026.

---

## What it is

AeroCoach translates VO2max — a fitness number people already track via a wearable — into a
plain-English read on their obstructive sleep apnea (OSA) risk. An estimated 83.7 million US
adults have OSA; roughly 80% don't know it. AeroCoach is a nudge toward finding out, not a
diagnosis: it walks someone through STOP-BANG (a validated 8-question clinical screening tool),
scores it deterministically in code, and uses Gemini only to translate the already-decided result
into language a non-clinician can understand.

Built by **AeroGlyphics** for the **Build with Gemini XPRIZE** (Category: **Education & Human
Potential**).

## Team

- **Liyanda Lionel Ncube (Lio)** — technical/AI integration lead
- **Jyrah Azlei Placido** — product design; UI/UX and frontend implementation (not marketing —
  the role drifted hard from its original "Product Marketing and Analytics" label)
- **Digvijay Yadav** — technical mentor
- **Eangelica Aton** — coordinator/manager

## Core features (real, shipped)

- **Two real wearable integrations**, chosen on `/connect`:
  - **Fitbit**, via Google Health API OAuth
  - **Apple Watch**, via a client-side Health app export parser — the zip is parsed entirely in
    the browser and never uploaded (worked around Cloud Run's 32MB request-body limit), streamed
    through `fflate` in bounded 2MB slices to handle real multi-hundred-MB exports
- **VO2max estimate** via the Uth–Sørensen–Overgaard–Pedersen formula (HRmax/HRrest)
- **STOP-BANG screening** (8 yes/no questions; unchecked = no, made explicit in the UI)
- **Gemini-generated coaching result** — risk tier is a deterministic rule computed in code from
  the STOP-BANG score; Gemini's only job is turning that decided result into plain English, never
  deciding it. Every call traced through LangFuse.
- **Follow-up chat** — grounded Q&A about your own result, with best-effort PII (email/phone)
  redaction before anything reaches Gemini or LangFuse; three-dot "thinking" animation while it
  loads
- **VO2max age/sex context** — ACSM (11th ed.) / Cooper Institute reference ranges, shown in a
  collapsed-by-default toggle
- **Trend chart** — true calendar-day spacing (Google/Fitbit path), milestone detection (new
  high, improving streak)
- **Pseudonymity architecture** — no name, email, or account identity ever reaches Gemini;
  cross-visit history is linked via a one-way SHA-256 hash (of the OAuth refresh token for
  Google, or a random session ID for Apple), confirmed by the team as the intended bar
  (pseudonymous, not zero-linkage)
- **Real data retention** — disconnecting deletes the user's entire Firestore history
  (`deleteUserLogs()` / `db.recursiveDelete()`), not just the session cookie
- **Privacy policy** — finalized, no "draft/unreviewed" framing; real contact channel
  `aerocoachsupport@gmail.com` (⚠️ see Open Items — not yet created)
- **Consent gate** — explicit GDPR Art. 9 consent checkbox required before submitting screening
  answers
- **Hover-lift micro-interactions** on cards/buttons; light/dark themes with a teal-derived
  (not neutral) light-mode palette so both themes "mesh" the same way

## Tech stack

Next.js 16 (App Router, React 19, TypeScript) · Tailwind CSS v4 · Google Gemini API
(`generateContent`, non-streaming) · Google Cloud Firestore · Google Health API (Fitbit OAuth) ·
LangFuse · Google Cloud Run (continuous deploy from `master`) · `fflate` (client-side zip
parsing) · 137 automated tests (per Lio's last verified run)

## Competition status

- Registered Aug 9 under Category 5: Professional Services; **switched to Education & Human
  Potential** on Aug 17, per Jyrah's decision
- Team framing throughout: a **practice sprint**, not a win-focused entry — late registration
  (~1 week runway), $0 budget, prioritizing real technical/product experience over competing
- **Deadline (Aug 17, 1:00pm PT) was missed** via the Devpost portal — a stale Cloud Run
  deployment and a teammate having to step away unexpectedly on the final day
- **Submitting via direct email** to organizers (michelle@devpost.com, testing@devpost.com,
  judging@hacker.fund) instead, per Eangelica's guidance
- **No fabricated users, revenue, or footage anywhere** — an explicit, consistent team stance;
  revenue/user-evidence fields are answered honestly as "none" rather than padded

## Submission deliverables

| Item | Status |
|---|---|
| Demo video | ✅ Done — founder-recorded (Jyrah + Lio narrating live), real screen recording |
| Written narrative (500–1000 words) | ✅ Done — `NARRATIVE_DRAFT.md`, ~860 words |
| Submission doc layout | ✅ Done — see scratchpad `submission_doc_layout.md` |
| Revenue/user evidence | ✅ Honestly reported as none |
| Organizer email | ⬜ Not yet sent |

## Open items — real, unresolved

- **`aerocoachsupport@gmail.com` doesn't exist yet.** The privacy policy publicly states it as a
  working contact channel. Needs to be created and actually monitored — a stated channel nobody
  checks is worse than no channel.
- **Cloud Run deploy staleness** was never root-caused from this environment (no GCP console
  access here) — confirm the live site actually reflects `master` before relying on it further.
- **No Node/npm in this working environment all session** — every Claude-authored code change
  was manual-review verified only, never run through `npm run build`/`tsc --noEmit`/`eslint`/
  `npm test` independently. Lio's own commits cite his own locally-run test counts.
- **No formal legal review** of the privacy policy — the "draft, needs legal review" disclaimer
  was removed per explicit direction, but no lawyer has actually reviewed it.
- **"More wearables"** on `/connect` is an honest roadmap placeholder, not a built feature.
- Data retention has no time-based auto-expiry beyond "kept until you disconnect" — a real,
  deliberate policy now, not a gap, but worth knowing if requirements change later.

## Where things live

- **Repo:** `github.com/lio-cs/vo2max-predictor`
- **Full process/decision history:** `AEROCOACH_PLAN.md` (repo root, synced with a Downloads copy)
- **Submission narrative:** `NARRATIVE_DRAFT.md`
- **AI-voiceover video script (superseded):** `VIDEO_SCRIPT_DRAFT.md`
- **Founder-led live demo script (what was actually used):** scratchpad `live_demo_script.md`
  (not yet committed to the repo)
- **Devpost/email submission doc layout:** scratchpad `submission_doc_layout.md` (not yet
  committed to the repo)
- **Legal/medical disclaimer draft:** `DISCLAIMER_DRAFT.md`
- **Static UI preview (Artifact, stale vs. current repo):**
  `https://claude.ai/code/artifact/dc8308e4-fcac-4057-ac65-ef90d5424e80`
