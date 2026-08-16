# AeroCoach — Gemini XPRIZE practice sprint

**Team (day-to-day build):** Liyanda Lionel Ncube (technical/AI integration), Jyrah Azlei
Placido (market analysis + UI/UX)
**Mentor/coordinators:** Digvijay Yadav (technical mentor), Eangelica Aton (coordinator)
**Status:** Reconciled against the Aug 9, 2026 "Office hours with Digvijay" meeting. This
supersedes earlier assumptions made before that meeting (category and product framing below
both changed).

---

## 1. Context

We were assigned to look at the [Build with Gemini XPRIZE](https://www.geminixprize.com/)
($2M pool, XPRIZE × Google). It requires a 90-day real operating business — live product,
real customers, real revenue with financial evidence. Final deadline is **Aug 17, 2026**;
registration happened with about a week of runway left.

**Team decision (confirmed in the Aug 9 meeting with Digvijay):** prioritize building
experience over competing with other teams, given the late entry. This doesn't mean skipping
the submission — the team is registering and building for real — it means the bar is "learn
the tech properly," not "win."

**Other decisions locked in that meeting:**
- Registered under **Category 5: Professional Services** *(not Education & Human Potential —
  earlier drafts of this plan had the category wrong before this meeting happened)*
- Security features and PII/data anonymization are **deferred to phase two** — focus on a
  working end-to-end MVP first
- Project budget capped at **$0** — free tiers only

## 2. What "AeroCoach" actually is

**Per the team's Aug 9 meeting:** an AI chat coach that collects VO2max and sleep data from
wearables (Fitbit, and sleep-data sources generally), and uses the VO2max predictor to turn
that into actionable health insight in plain English — targeted at **Obstructive Sleep Apnea
(OSA)**. Problem framing: an estimated 1 billion people globally (35 million in the US) have
untreated/undiagnosed OSA.

**⚠️ Open gap:** the code built on Aug 9 (before this meeting's context was available) framed
the risk model around general cardiometabolic mortality risk (VO2max → fitness quintile →
hazard ratio), pulled from the aeroglyphics.dev marketing framing — not OSA specifically. That
code is a real, working technical scaffold, but it isn't yet pointed at the actual agreed
problem. See checklist item below — this needs a decision before we build much further on top
of it.

**Update (Aug 10, from Jyrah's marketing/research brief — see §7):** this partially resolves
the gap above. The recommendation is: **OSA stays the near-term product focus**, and
**VO2max is the legitimate evidence base for what AeroCoach actually does** (a Fitbit-derived
estimate, not full clinical polysomnography). A separate, much larger research asset — SleepFM,
a real Stanford/Zou Group model published in *Nature Medicine* (verified, not fabricated — see
§7) — predicts 130 conditions from full overnight PSG data, which AeroCoach's wearable data
does *not* provide. That gets positioned as brand credibility / roadmap, not a claim about what
the current product itself does. Don't blend the two evidence bases in copy or in the coaching
prompts.

## 3. What's already built (as of Aug 11 — see §8 for the Aug 11 rework details)

All in `vo2max-predictor/`, builds and type-checks clean, $0 spend (free tiers only):

| File | What it does |
|---|---|
| `lib/riskTrajectory.ts` | STOP-BANG scoring (validated OSA screen) + VO2max fitness trend as separate supporting context |
| `lib/geminiCoach.ts` | Gemini API call (traced via LangFuse) → plain-English coaching copy; risk tier and action type are deterministic, not model-decided |
| `lib/coachLog.ts` | Firestore logging (no-ops until GCP is configured) |
| `app/api/coach/route.ts` | POST route accepting STOP-BANG answers, composing the full flow |
| `app/StopBangForm.tsx` | Client-side 8-question form + results panel |
| `app/FollowUpChat.tsx` | Post-result follow-up chat (suggested questions + free text) |
| `app/api/coach/ask/route.ts` | POST route for follow-up questions, same auth/rate-limit gates as `/api/coach` |
| `app/page.tsx` | Home page, renders the form once authenticated |
| `instrumentation.ts` | Registers LangFuse tracing at server startup (no-ops if unconfigured) |
| `lib/rateLimit.ts` | In-memory rate limiting (10 req/min per client) on `/api/coach` |
| `Dockerfile`, `.dockerignore` | Multi-stage build using `output: "standalone"` |
| `DISCLAIMER_DRAFT.md` | Draft medical/compliance disclaimer — prep for a real legal review, not sign-off |
| `NARRATIVE_DRAFT.md` | Draft ~800-word XPRIZE submission narrative — practice format, honest about no real revenue/users |

**Tech stack: resolved Aug 11.** Stayed TypeScript/Next.js + added LangFuse (v5, OTel-based)
rather than introducing a Python + LangChain service — see §8.

## 4. Roles

**Lionel — technical/AI integration:**
- OSA framing and tech-stack decisions both resolved and implemented Aug 11 (§8)
- Own the real next-steps assigned in the Aug 9 meeting (see checklist)

**Jyrah — market analysis + UI/UX:**
- ~~OSA-specific competitive/market scan~~ — **done Aug 11**, see §7a
- ~~UI/UX pass on `app/StopBangForm.tsx`~~ — **done Aug 15**, see §10f. Full Coach panel
  redesign against the six-state spec, not just the form: spec-compliance audit, full-screen
  responsive layout, formal navy/off-white/teal rebrand with a Fraunces display font, motion,
  and minimalist icons on states 2/3/6.

## 5. Timeline & schedule (Aug 10 → Aug 17 deadline)

*Original plan below; actual progress has run ahead of it (the Aug 12/13 rework happened Aug
11) — §9's Daily Log is the up-to-date source of truth for what's actually done.*

| Date | Lionel | Jyrah / Group |
|---|---|---|
| Aug 10 | Test VO2max predictor codebase; register for Gemini Prize platform (credit limits); research AWS/Google student credit programs; test Fitbit connector | Group: finish hackathon registration; research OSA prevalence stats; research PaaS vs. SaaS definitions |
| Aug 11 | Decide OSA-vs-cardiometabolic framing + tech-stack question (§2, §3); feed GitHub repo + the Nature sleep/disease paper into Claude for context | Track down the "Workalyzer" (Fitbit↔Gemini) and safety/guardrails API links once shared; start OSA-specific market scan |
| Aug 12 | Rework `lib/riskTrajectory.ts` + `geminiCoach.ts` prompts toward OSA framing (if that's the decision from Aug 11) | UI/UX audit of `Coach` panel against the OSA framing |
| Aug 13 | Set up LangFuse observability (token usage monitoring) regardless of the stack decision | Implement UI/UX improvements |
| Aug 14 | Stress-test agent across multi-day trend data; basic prompt guardrails (per Digvijay: guardrails now, full auth/PII masking later) | Draft OSA-specific narrative framing (also useful for AeroGlyphics' own pitch story) |
| Aug 15 | Docker container for the app (per Digvijay: local/on-prem, easy to share with the team) | Storyboard demo video; mock P&L/market-sizing slide |
| Aug 16 | Capture demo, final integration pass | Finalize narrative + video |
| Aug 17 | **Deadline 1:00pm PT** — submit | — |

## 6. Checklist

**Immediate (carried over directly from the Aug 9 meeting notes)**
- [x] Group: complete hackathon registration — done Aug 10
- [x] Lionel: test the VO2max predictor codebase end-to-end — build/type-check clean, home page
      and both API routes verified (correct 401s when unauthenticated); full OAuth round-trip
      still needs a live run with real Google Health credentials once `.env.local` is set up
- [x] Lionel: register for the Gemini Prize platform, determine credit limits — registered
      Aug 10. Credit limit checked (Claude, via `xprize.devpost.com/resources` and the main
      page): **no hackathon-specific credit tier is publicly documented** — only the standard
      $300/90-day Google Cloud free trial and Antigravity's $0/month plan, same as any new GCP
      account gets. If a bonus code arrived by email/Devpost account separately, note it here;
      otherwise budget around the standard $300 trial + Always Free tier.
- [x] Lionel: research AWS/Google student credit programs — verdict: **not worth chasing.**
      AWS Educate ($100, fast approval) doesn't satisfy the "must use Google Cloud" requirement;
      Google's official student credit path takes up to 3 weeks to process, too slow for Aug 17.
      The existing $300 GCP trial + Always Free tier already covers this build. GitHub Student
      Developer Pack is fast and free if wanted opportunistically, but non-essential.
- [x] Lionel: test the Fitbit connector / QA the integration — **found and fixed a real bug**:
      `getLatestRestingHeartRate` in `lib/googleHealth.ts` took `points[points.length - 1]` as
      "latest," but Google's docs confirm dataPoints responses are ordered **descending** by
      interval start time (most recent first) — the code was silently reading up-to-7-day-stale
      heart rate data instead of today's. Fixed to `points[0]`. Everything else checked out:
      CSRF state handling in the OAuth callback is correctly implemented, and the `Profile`
      endpoint's `age` field is real and documented as used. Build/type-check clean after the fix.
- [x] Lionel + Jyrah: feed the GitHub repo and the Nature sleep/disease paper into Claude —
      repo fully read; SleepFM paper pulled from the open-access PMC mirror (nature.com is
      login-gated) — see the new findings under §7
- [x] Group: research OSA prevalence stats (global + US) — via Jyrah's brief, independently
      verified by Claude: **~936M–1B adults globally**, **83.7M US adults / 32.4% of US adults
      20+ (2024 estimate)**, **80%+ undiagnosed** across every source. See §7.
- [x] Group: research PaaS vs. SaaS — verdict: AeroCoach (the end-user app) is SaaS; "platform"
      language belongs to AeroGlyphics' longer-term story if the risk engine is later exposed
      as an API for health systems/EHRs to build on, not to what's being submitted now
- [ ] Group: set up the necessary project tools within the Gemini platform
- [x] Safety/guardrails — **stopped waiting on Eangelica's link, built it ourselves (Aug 12).**
      Found a real, concrete gap: Gemini's default safety threshold for the 2.5/3 model series
      is `OFF` unless explicitly set, so our calls had zero built-in content-safety filtering
      configured. Added explicit `safetySettings` (all four harm categories,
      `BLOCK_MEDIUM_AND_ABOVE`) to the `generateContent` request in `lib/geminiCoach.ts`, plus
      handling for `promptFeedback.blockReason` and non-`STOP` `finishReason` so a blocked
      response fails clearly instead of hitting the generic "unexpected shape" error. This is
      separate from (and in addition to) the injection/output-validation/rate-limiting
      guardrails already done Aug 11.
      **Two follow-up hardening fixes, same day:** (1) the Aug 11 rate limiter was spoofable —
      keyed only on `X-Forwarded-For`, which a client controls unless behind a trusted proxy —
      so added a global backstop (30 req/min across *all* clients combined, not per-key) in
      `lib/rateLimit.ts`; smoke-tested with 31 requests each using a different fake IP,
      confirmed the 31st still got `429` regardless. **Caveat, stated plainly rather than left
      as an overclaim:** this backstop lives in a single process's memory, so it's only a true
      global ceiling on a single instance — if this were ever deployed to Cloud Run and
      autoscaled to, say, 3 instances, each gets its own counter, so the real ceiling becomes
      3× the stated number, and a spoofed-IP attacker hitting different instances could
      partially evade even the per-client limit. Would need a shared store (Redis/Firestore) to
      close that for real; not done, logged as a known limitation instead. (2) "Never imply
      diagnosis" only lived in the system prompt — an instruction, not an enforced constraint —
      so added `DIAGNOSTIC_LANGUAGE_PATTERNS` to `validateGeminiCopy()` in `lib/geminiCoach.ts`,
      rejecting any Gemini output that contains diagnostic-sounding phrasing ("you have OSA,"
      "you're diagnosed," etc.) before it ever reaches a user.
      **Third pass, same day — two more real findings:** (3) the Gemini API key was passed as a
      `?key=` URL query parameter rather than a header, risking leakage into any URL-logging
      middleware/proxy/crash-report tooling — switched to the `x-goog-api-key` header per
      Google's own recommended usage in `lib/geminiCoach.ts`. (4) Several error paths
      (`/api/coach`'s Firestore and Gemini failure branches, plus the pre-existing
      `health_api_error` case in `lib/vo2max-service.ts` that flows straight into the UI) were
      returning raw exception messages — including, in the Health API case, Google's raw
      response body — directly to the client/UI. Switched all three to generic client-facing
      messages with full detail logged server-side only (`console.error`; the Gemini path also
      already has full detail in its LangFuse trace).
- [ ] Workalyzer link — still waiting on Eangelica, no workaround identified yet (unclear what
      the tool actually is without her link)

**Decisions still open**
- [x] **OSA risk-model framing resolved (Aug 11)** — see §8 for the full rework: STOP-BANG
      questionnaire (validated, verified thresholds) drives the risk tier; VO2max trend is
      supporting context only, never a risk-tier input; Gemini does the plain-English
      translation layer only, never the clinical judgment
- [x] **Tech-stack question resolved (Aug 11)** — stayed TypeScript/Next.js, added LangFuse
      (v5, OTel-based) via `instrumentation.ts` + `@langfuse/tracing`. No Python/LangChain
      rewrite — not enough runway before Aug 17 and the raw REST approach already works
- [x] **Domain resolved** — `sleepfm.one` confirmed as the production site; "Sleep.FM" as a
      standalone brand name is dropped, product is branded **AeroCoach** throughout (§7)
- [x] **Product scope resolved** — AeroCoach (VO2max/OSA coach), evidence base is
      cardiorespiratory fitness (VO2max) literature; the SleepFM/PSG research stays explicitly
      roadmap-only context (§5a/§5b split in the corrected brief), not a current-product claim (§7)
- [ ] Get a legal/compliance read on the "wellness tool, not a diagnostic device" disclaimer
      before publishing anything with disease-prediction claims (§7). **Draft ready** at
      `DISCLAIMER_DRAFT.md` (short version already live in `app/StopBangForm.tsx`) — this item
      stays open until an actual human reviews it, the draft is prep, not sign-off.

**Build**
- [x] Rework risk model + Gemini prompts for OSA — done Aug 11, see §8
- [x] LangFuse observability wired in — done Aug 11, see §8
- [x] Basic prompt guardrails against injection/abuse — done Aug 11: system-prompt-level
      instructions to treat input data as data (not commands), output validation (non-empty,
      length-bounded) before use, and rate limiting (10 req/min per client) on `/api/coach`.
      Full auth + PII masking still explicitly deferred to phase two per Digvijay.
- [x] UI/UX pass on the new STOP-BANG form matching the OSA framing (Jyrah) — **done Aug 15**,
      see §10f. Grew into a full Coach panel redesign, not just the form.
- [x] Docker container for local/shared running — done Aug 11: multi-stage `Dockerfile` using
      `output: "standalone"`, verified the build produces the expected `.next/standalone`
      structure (Docker itself isn't installed in this sandbox to run a full `docker build`,
      so a live image build is still worth doing once you're on a machine with Docker)
- [x] Automated test suite — done Aug 13. Zero test coverage existed before this despite how
      much safety/clinical-scoring logic had accumulated (STOP-BANG thresholds, the diagnostic-
      language guard, the rate limiter's global/per-client interaction). Added Vitest ($0) with
      `vite-tsconfig-paths` for `@/` alias resolution; 45 tests across `lib/riskTrajectory.ts`
      (STOP-BANG scoring incl. the score-of-3 refinement rule, peer-average interpolation,
      trend detection), `lib/rateLimit.ts` (per-client + global backstop, via fake timers to
      keep tests isolated from shared module state), `lib/geminiCoach.ts`'s `validateGeminiCopy`
      (length bounds, diagnostic-language patterns), and the API route's `parseStopBangAnswers`.
      **Caught a real bug immediately**: the diagnostic-language regex for "you've got OSA"
      assumed a space before `'ve got` that contractions don't have, so it silently never
      matched — fixed. `npm test` added to `package.json`; confirmed the new `route.test.ts`
      inside `app/api/coach/` doesn't get picked up by Next's router (production build still
      shows only the real routes).

**Submission prep**
- [ ] Demo recording
- [x] Practice narrative draft, OSA-framed — done Aug 11 at `NARRATIVE_DRAFT.md` (~800 words,
      hits all four required topics: daily AI usage, human/AI split, economic opportunity, and
      the build story — honest about having no real revenue/users rather than fabricating
      traction; explicitly labeled as a practice draft for a human to review, not final copy)
- [ ] Video script/storyboard
- [ ] Mock P&L / market-sizing slide

## 7. Marketing/research brief (Jyrah, Aug 10 — corrected version)

Full document: `Downloads/AEROCOACH_MARKETING_CAMPAIGN.md` (supersedes the earlier
`Downloads/SLEEPFM_MARKETING_CAMPAIGN.md` draft — domain and branding are now resolved).

**Fact-check status:** same underlying research as the earlier draft, already independently
verified by Claude against primary sources — both hold up, not fabricated:
- SleepFM paper is real: *Nature Medicine* (Jan 2026), Rahul Thapa (lead), James Zou/Emmanuel
  Mignot (senior authors), 585K PSG hours, ~65K participants, 130 conditions, C-Index numbers
  match exactly (mortality 0.84, dementia 0.85, MI 0.81, etc.)
- OSA prevalence stat verified: 83.7M US adults / 32.4% (2024), *Respiratory Medicine* 2025
  systematic review

**Resolved:** site is **sleepfm.one**; the product/brand is **AeroCoach** (not "Sleep.FM" as a
standalone name — that branding is dropped). Evidence-base separation is explicit and clean in
this version: §5a (VO2max/CRF literature) is what AeroCoach's Fitbit-based MVP actually stands
on; §5b (full-PSG SleepFM research, 130 conditions) is explicitly labeled roadmap/pitch context,
not a claim about the current product.

**Recommended headline stat:** lead with **"80% undiagnosed,"** not the raw prevalence count —
it's the number that most directly justifies why a coaching product (vs. a diagnostic one)
makes sense.

**Positioning pillars from the brief:**
1. ~~Zero new hardware, zero new habit~~ — **retired Aug 11**, see §7a: Sleep Cycle and
   Sleep.ai both screen from a phone alone, no wearable at all, which undercuts this as a lead
   hook. Replaced with a narrower, still-defensible claim (§7a §6).
2. The invisible-majority hook ("80% undiagnosed")
3. Plain-language AI coach, not a dashboard — explicit design constraint from the mentor's own
   success criterion
4. Built lean, built real — the $0-budget, live-Fitbit-integration MVP is a feature to state
   plainly in the XPRIZE narrative, not a limitation to hide
5. Room to grow beyond OSA — VO2max/sleep data's broader research links (§5) are the roadmap
   story for a Professional Services pitch, not today's claim

**⚠️ One evidence-base nuance worth flagging before reworking the code (not called out
explicitly in the brief itself):** the brief's §5a evidence is CRF/VO2max → *mortality and
general disease risk*. It is not direct evidence that VO2max predicts *OSA specifically* — low
fitness and OSA are both correlated with obesity, but the brief doesn't cite a study linking
VO2max directly to OSA risk. Worth keeping the coaching copy honest about this: VO2max/fitness
trend is a reasonable general health signal to combine with a proper OSA screen (e.g. a
validated questionnaire like STOP-BANG), not a direct OSA risk score on its own.

**From reading the actual SleepFM paper directly (Claude, Aug 10 — via the open-access PMC
version, nature.com itself is login-gated):**
- **New, more relevant number for the OSA pivot:** the paper reports OSA-specific performance
  separate from the general 130-condition C-Index framing — **sleep apnea presence detection at
  87% accuracy, severity classification at 69% accuracy.** Worth using this over the general
  mortality C-Index when the narrative is specifically about OSA.
- **The paper itself has no evidence this works on consumer wearable data** — it requires
  multi-channel clinical PSG (EEG+ECG+EMG+respiratory); the only mention of wearables in the
  whole paper is one speculative closing sentence. This *reinforces* (from the primary source
  itself, not just caution) why AeroCoach's copy must not imply its Fitbit-based product
  inherits SleepFM's disease-prediction performance.
- **Data use restriction — checked and cleared (Aug 11).** Confirmed
  `github.com/eangelica2014/sleepfm-clinical` is code-only (preprocessing scripts, model code,
  notebooks, MIT-licensed) — no bundled PSG data. The README points users to the official
  Stanford data release (bdsp.io) separately rather than including any restricted data itself.
  Safe to treat as a project asset.
- Also confirms the selection-bias caveat already in both briefs: the training cohort is
  people already referred for a sleep study, not the general population.

## 7a. OSA competitive & market scan (Jyrah, Aug 11)

Full document: `Downloads/Telegram Desktop/AEROCOACH_OSA_MARKET_SCAN.md`. Fact-checked by
Claude (Apple Watch, Withings, and Google Health Coach claims spot-checked against primary/news
sources — all verified accurate, same track record as Jyrah's earlier marketing briefs).

**⚠️ Most important finding — read this even if nothing else:** Google is building AeroCoach's
exact product shape natively into the platform AeroCoach's own data comes from. **Google Health
Coach** (Gemini-powered, launched May 19, 2026, $9.99/mo Premium tier) already does
conversational sleep coaching on Fitbit data, plus a **"Get care now"** research study with
Included Health testing AI-driven virtual-care referrals — the same "data → conversational
AI → path to care" shape as AeroCoach, built by the company AeroCoach authenticates through.
This doesn't invalidate the hackathon build (still meets the mentor's MVP/learning bar) but the
team should have a ready answer if asked "why build this when Google already does it": AeroCoach
is a focused, OSA-specific, explainable proof of concept for learning the stack — not a bet
against Google's own roadmap on the same data.

**Other things worth knowing:**
- **No direct competitor does exactly what AeroCoach does**, but the space around it is crowded:
  FDA-cleared wearable screening (Apple Watch: 66.3% sensitivity / 98.5% specificity, confirmed
  accurate; Samsung), dedicated hardware (Withings: 88%/88.6%, FDA 510(k)-cleared, ~$170–200
  one-time, confirmed accurate), ambient wearables (Oura — now partnered with **ResMed** for
  direct physician referral, closing the exact "nudge to seek care" loop; WHOOP Coach — the
  closest UX analog, OpenAI-powered conversational coach on biometric data), phone-only
  screening with **no wearable at all** (Sleep Cycle, Sleep.ai), and post-diagnosis compliance
  AI (ResMed myAir/"Dawn").
- **No competitor uses VO2max/cardiorespiratory fitness as its OSA signal** — everyone else
  screens from direct respiratory data (breathing disturbance, SpO2, snoring audio). This is
  genuine white space, but also *externally confirms* the evidence-base caution already in §7:
  VO2max isn't a direct, validated OSA signal the way breathing disturbance is. Keep coaching
  copy in "worth getting screened for" territory, not "detects OSA" territory.
- **Market sizing**: no clean, separately-tracked category exists yet for "AI coaching layered
  on wearable data" — it's bundled into hardware/subscription ecosystems everywhere it appears.
  The sleep-apnea *devices* market (closest proxy, mostly hardware) is ~$7–9B (2025/26) across
  multiple research firms, projected to $13–21B by the early-to-mid 2030s.
- **New positioning recommendation** (replaces the retired "zero new hardware" pillar): *"Nobody
  else is translating the fitness number you already track into a sleep-apnea conversation."*
  Every direct competitor screens from breathing/oxygen data; AeroCoach is the only one starting
  from VO2max. Narrower than the old pillar, but still genuinely defensible.

**Done Aug 15, see §10f:** the UI/UX audit of `app/StopBangForm.tsx` (and the rest of the Coach
panel) — the positioning shift above (retire "zero new hardware," lead with the VO2max→OSA
hook) is live in the actual copy, not just this scan.

## 8. OSA rework (Aug 11)

Both blocking decisions from the checklist resolved and implemented same-day:

**Risk model** (`lib/riskTrajectory.ts`): replaced the cardiometabolic fitness-quintile model
with STOP-BANG, a validated 8-item OSA screening questionnaire (Chung et al.; exact items and
scoring thresholds — 0–2 low, 3–4 intermediate, 5–8 high, plus the score-of-3 refinement rule —
verified against current clinical references before implementing). VO2max trend is computed
separately (`assessFitnessContext`) and surfaced as supporting context only — it does not feed
into the OSA risk tier, per the evidence-base caution in §7.

**Coaching decision** (`lib/geminiCoach.ts`): the recommended action type (`monitor` /
`mention_to_doctor` / `see_doctor_soon`) is deterministic, mapped directly from the STOP-BANG
tier in code — Gemini never decides it. Gemini's only job is the plain-English translation
layer: risk explanation, action rationale, motivational nudge. This matches the mentor's own
success criterion (§9) more literally than the old design did.

**API/UI**: `/api/coach` is now a POST route accepting the 8 STOP-BANG answers (STOP-BANG isn't
derivable from wearable data — it needs user input). `app/StopBangForm.tsx` is a new client
component with the questionnaire and a results panel; replaces the old auto-fetching server
component. Functional but not yet styled beyond basics — flagged in the checklist for Jyrah.

**LangFuse** (`instrumentation.ts` + `lib/geminiCoach.ts`): the SDK was rewritten in v5 (OTel-
based) as of March 2026 — confirmed current usage against the real type definitions rather than
trusting the first doc example, which didn't match the actual API (`generation.update()` uses
`usageDetails: { promptTokens, completionTokens, totalTokens }`, and the observation type is
set via `startActiveObservation(name, fn, { asType: "generation" })`, not inside `.update()`).
Traces model, input/output, and token usage per coaching call; no-ops if `LANGFUSE_SECRET_KEY`/
`LANGFUSE_PUBLIC_KEY` aren't set.

**Verified:** `npm run build`, `tsc --noEmit`, and `eslint` all clean; smoke-tested the new
route (`400` on missing STOP-BANG answers, correct `401` when unauthenticated with a valid
payload).

## 9. Daily log

### Aug 10 — achieved

- Reconciled this entire plan against the Aug 9 mentor meeting (category → Professional
  Services, product → OSA-focused, team/mentor structure, real next-steps list)
- Resolved PaaS vs. SaaS: AeroCoach is SaaS; "platform" language is a later-story claim, not
  today's
- Applied and fact-checked Jyrah's marketing brief (two drafts) — SleepFM paper and OSA
  prevalence stats independently verified as real, not fabricated; domain resolved to
  `sleepfm.one`; brand resolved to **AeroCoach**; product scope resolved (VO2max evidence base
  now, SleepFM/PSG research as roadmap only)
- Tested the VO2max predictor codebase end-to-end — clean build, routes behave correctly
- Researched AWS/Google student credits — concluded not worth pursuing, existing free tier
  already sufficient
- **QA'd the Fitbit connector and found + fixed a real bug**: `getLatestRestingHeartRate` was
  reading the oldest of 7 days instead of the latest (wrong assumption about API sort order,
  confirmed backwards against Google's own docs) — every VO2max estimate to date would have
  used stale heart-rate data
- Read the actual SleepFM paper (not just the marketing brief's summary) — surfaced real
  OSA-specific accuracy numbers (87% presence / 69% severity), confirmed the paper has no
  consumer-wearable evidence (reinforcing the evidence-base separation), and flagged a data-use
  restriction to check on the forked research repo

### Aug 11 — achieved

- Completed hackathon registration and Gemini Prize platform registration (items 1–2 from
  yesterday's list); checked the credit limit question directly — no hackathon-specific tier
  publicly documented, budgeting around the standard $300 trial
- **Resolved and implemented both blocking decisions same-day** (full detail in §8):
  - OSA risk model reworked around STOP-BANG (validated, verified thresholds) + VO2max as
    separate supporting context, not a risk-tier input
  - Tech stack stayed TypeScript/Next.js; added LangFuse (v5, OTel-based) for observability
    instead of a Python/LangChain rewrite
- Rebuilt `lib/riskTrajectory.ts`, `lib/geminiCoach.ts`, `lib/coachLog.ts`, `/api/coach`
  (now POST), and shipped a new `app/StopBangForm.tsx` client component
- Verified LangFuse's real v5 API against its actual type definitions rather than trusting the
  first doc example (which didn't compile) — caught before it shipped broken
- Full verification pass: build/lint/type-check clean, smoke-tested the new route's validation
  and auth-gating behavior

### Aug 11, continued — also achieved same day

- ~~Basic prompt guardrails~~ — **done**: system prompt now treats input data as data (not
  commands), output is validated (non-empty, length-bounded) before use, `/api/coach` is
  rate-limited to 10 req/min per client
- ~~Confirm the `sleepfm-clinical` fork doesn't bundle restricted PSG data~~ — **done, cleared**
  (code-only fork, MIT-licensed, no bundled data — see §7)
- ~~Docker container~~ — **done**: multi-stage `Dockerfile` using `output: "standalone"`;
  verified the build produces the exact structure the Dockerfile expects. Docker itself isn't
  installed in this sandbox, so an actual `docker build` is still worth running once on a
  machine that has it.

### Aug 11, continued further — disclaimer draft

- Drafted `DISCLAIMER_DRAFT.md`: short + long disclaimer versions, the actual reasoning behind
  them (STOP-BANG screens for a *named disease*, which sits outside FDA's general-wellness
  safe-harbor unless kept strictly non-diagnostic and clinician-routing; the explanatory text
  is LLM-generated, so the disclaimer has to hold regardless of Gemini's specific phrasing on
  any given run), and open questions for whoever does the real review
- Applied the tightened short version live to `app/StopBangForm.tsx` (both the intro and
  results-panel disclaimer text) — a strictly more careful version of what was already there,
  so it didn't need to wait for review; the fuller draft still does

## 10a. Repo is live

`https://github.com/lio-cs/vo2max-predictor` — public, pushed Aug 13. Verified clean before and
after publishing: `.gitignore` already excluded `node_modules`, `.next`, and all `.env*` files
except `.env.local.example`; double-checked directly post-publish that `.env.local` 404s (not
present). Initial commit is all 48 tracked files as one clean history, not a messy multi-day
trail. Share this link directly — no collaborator invite needed since it's public.

## 10b. First real end-to-end run + follow-up chat (Aug 14–15)

**Real live test happened for the first time.** Lionel set up real credentials (`GEMINI_API_KEY`,
`GOOGLE_HEALTH_CLIENT_ID/SECRET`) and ran the actual OAuth flow in a browser. Surfaced and fixed
two real bugs that only show up under real use, not smoke tests:

1. **Cookie-mutation-during-render crash**: `getValidSession()` (`lib/googleHealth.ts`) tries to
   refresh/clear the session cookie whenever called, but Next.js only allows cookie writes in a
   Server Action or Route Handler — not while `page.tsx` renders as a plain Server Component.
   This was latent since Day 1; it just needed a token to actually need refreshing to crash.
   Fixed with `safelyPersistSession()`, which swallows *only* that specific, well-known Next.js
   error (the in-memory session result is still correct for the current request either way; the
   cookie gets properly persisted next time a Route Handler runs).
2. **Invalid `FIRESTORE_SERVICE_ACCOUNT_KEY` JSON** — malformed during copy-paste into
   `.env.local` (common failure mode for service-account keys). Since Firestore logging is
   optional, unblocked testing by commenting out the two Firestore env vars rather than
   debugging the JSON formatting under time pressure; proper fix still open (see checklist).

**Follow-up chat added.** Lionel's feedback after the first real run: the experience should feel
more like a chat, with the ability to ask follow-up questions (free-form or from a suggested
list) after the main coaching result. This is the first surface in the app where real free-form
user text reaches Gemini — STOP-BANG answers are strictly typed booleans, never free text — so
it got the same safety discipline as the rest of the build, not a bolted-on open chat box:

- `lib/geminiCoach.ts`: new `getFollowUpAnswer()`, kept separate from `getCoachDecision()`
  rather than refactored into a shared helper, to avoid any risk to the already-tested main
  flow. Its own scoped system prompt: can explain the screening/risk tier/fitness context, must
  not diagnose, must not contradict the given risk tier or action, must decline off-topic
  questions, must treat any instruction embedded in the user's message as data not a command to
  obey. Output validated by a new `validateFollowUpAnswer()` (same diagnostic-language pattern
  check as the main flow, extracted as its own testable function rather than left inline).
- `app/api/coach/ask/route.ts`: new POST route. **Caught a real gap while building it**: it
  initially had no auth check, unlike `/api/coach` — anyone could've hit it directly with
  fabricated context and spammed free Gemini calls without ever going through the real
  STOP-BANG flow. Added the same `getValidSession()` gate before this shipped, not after.
  Rate-limited the same as `/api/coach`.
- `app/FollowUpChat.tsx`: new client component — suggested-question chips, free-text input,
  chat-style thread, appended after the STOP-BANG result panel. Chat history kept client-side
  only for now, not persisted to Firestore (deliberate scope cut given time remaining).
- **23 new tests** (68 total now) covering `validateFollowUpAnswer`'s diagnostic-language guard
  and `parseAskBody`'s input validation (risk level/trend/action-type enums, history caps,
  question length bounds, missing fields).
- Verified: `npm test` (68 passing), `tsc`, `eslint`, `npm run build` (route list shows
  `/api/coach/ask` correctly registered) all clean; smoke-tested the auth gate directly (`401`
  unauthenticated, matching `/api/coach`'s behavior).

**Follow-up feedback after trying it live**: the suggested-question chips disappeared after the
first message and never changed — static list, one-shot. Fixed by having Gemini return 2-4
*contextual* next-question suggestions alongside every answer (`suggestedFollowUps`, part of the
same schema/response as `answer`, not a second API call), validated the same way (non-empty,
length-bounded, capped at 5 even if the model returns more). `app/FollowUpChat.tsx` now keeps
the chip row visible for the whole conversation and swaps in the new suggestions after each
turn, falling back to the original static list only before the first message. 6 more tests (74
total) covering the new validation; `npm test`/`tsc`/`eslint`/`npm run build` all reverified
clean after the change.

## 10c. Deployment documentation (live as of Aug 15–16)

**Live URL:** `https://vo2max-predictor-git-89170208601.europe-west1.run.app`

| Setting | Value |
|---|---|
| Platform | Google Cloud Run |
| GCP project number | `89170208601` |
| Region | `europe-west1` |
| Service name | `vo2max-predictor-git` |
| Source | Continuous deployment via **Developer Connect**, connected directly to `github.com/lio-cs/vo2max-predictor`, branch `master` — every push to `master` triggers an automatic Cloud Build → deploy |
| Build | Dockerfile-based (repo's own `Dockerfile`, `output: "standalone"`) |
| Container port | `3000` (had to be set explicitly — Cloud Run defaults to expecting 8080, our Dockerfile uses 3000) |
| Authentication | Allow public access (unauthenticated invocations) — required for a public-facing web app |
| Ingress | All (public internet) |
| Billing | Request-based (Always Free tier eligible) |
| Scaling | Min 0 instances (scales to zero, $0 when idle — cold start on first request), Max 3 (cost/abuse ceiling, also mitigates the rate limiter's per-instance-only backstop, see §6 guardrails notes) |
| Env vars set | `GEMINI_API_KEY`, `GOOGLE_HEALTH_CLIENT_ID`, `GOOGLE_HEALTH_CLIENT_SECRET`, `GOOGLE_HEALTH_REDIRECT_URI` (= the live URL + `/api/auth/callback`) — Firestore/LangFuse vars not set on this deployment, so both no-op there same as they optionally do locally |
| OAuth consent screen | Still in **Testing** mode — only accounts on the Test users list (Google Cloud Console → APIs & Services → Google Auth Platform → Audience) can actually log in. Lionel and Jyrah added so far. Going to Production requires a full Google verification process for the Restricted Health scopes — confirmed this takes **several weeks** including an annual CASA security assessment, not remotely feasible before Aug 17. Staying in Testing + adding known testers individually is the Google-sanctioned path for a small team like this, not a workaround (see §10d C). |

**Known deployment gotchas hit and fixed (worth knowing if redeploying from scratch):**
1. First build failed: Cloud Build's service account (`89170208601-compute@developer.gserviceaccount.com`, the default Compute Engine SA, not the classic Cloud Build SA) needed `roles/developerconnect.readTokenAccessor` granted before it could read the newly-connected GitHub repo. One-time fix.
2. App was unreachable (generic 500) until Container Port was explicitly set to 3000.
3. Login worked but landed on the unroutable `http://0.0.0.0:3000` after Google's redirect — `app/api/auth/callback/route.ts` and `logout/route.ts` were deriving the redirect origin from `request.url`, which reflects the container's internal bind address behind Cloud Run's proxy, not the public host. Fixed by deriving origin from `GOOGLE_HEALTH_REDIRECT_URI` instead (already required to be the real public URL). See the Aug 15 commit `f87a7f7`.

## 10d. Aug 16 team meeting — full action list

Team meeting reviewed progress and discussed a broader set of directions ahead of the Aug 17
deadline. Two things worth flagging before the list itself:

- **Possible goal shift, needs resolving with the team, not assumed:** this meeting talks about
  a real investor/YC business pitch and "maximizing points" across judging buckets — a
  different bar than the "practice, not really competing" framing this whole plan (§1) has
  operated under, which is also why `NARRATIVE_DRAFT.md` deliberately doesn't fabricate
  traction. Worth an explicit answer from Eangelica/Digvijay on which framing is actually
  intended before finalizing the submission narrative.
- Several items below were already resolved by researching them directly (Gemini free-tier data
  use, Play Store feasibility) or were already built before this meeting happened (the agentic
  follow-up chat, advisor-not-diagnosis framing) — marked accordingly so effort doesn't get
  spent re-solving what's done.

**A. Meeting action items (verbatim)**
- [ ] Eangelica: share the existing VO2max 1.0 APK builds with the team — unclear what this
      refers to; possibly a separate/prior build outside this Next.js web app, needs clarifying
- [ ] Eangelica: prepare the business pitch + traction narrative for the Aug 17 submission
- [x] Figure out where the app is deployed + document the public URL/hosting config — done,
      see §10c
- [ ] Follow the Outskill tutorial (today/tomorrow) — general guidance, not a build task
- [x] Finish the mobile web homepage, refine UI beyond bare-bones — **done Aug 15**, see §10f.
      Full-screen layout uses a `min-h-dvh` shell with a `max-w-2xl` centered column, so it
      scales from phone to laptop off one codebase rather than needing a separate mobile pass.
- [x] ~~Investigate Google Play Store publishing~~ — **resolved: infeasible before the
      deadline.** New developer accounts require a mandatory 14-day closed test with 12
      testers before production review is even possible, plus 3–14 more days of review after
      that. Not close, not worth spending time on.

**B. New feature requests raised in discussion**
- [x] SpO2 as a second metric (Digvijay) — **done Aug 16**: verified `daily-oxygen-saturation`
      is a real Google Health API data type using the scope already granted, before building
      anything. `lib/googleHealth.ts`'s `getLatestOxygenSaturation()`; classification
      (normal/borderline/low, standard clinical thresholds) in `lib/riskTrajectory.ts`, kept
      as supporting context only, same treatment as VO2max — never an input to the STOP-BANG
      risk tier, since a daily wearable average is far coarser than the overnight
      desaturation-event monitoring that actually indicates OSA-related hypoxemia clinically.
      Best-effort fetch — absence or failure doesn't block the coaching flow.
- [x] Personalized messaging by age/VO2max range (Digvijay) — **done Aug 16**: added
      deterministic `classifyFitnessLevel` (below/average/above_average, standard
      exercise-physiology norm, not a disease-risk claim — kept separate from the OSA risk
      tier same as everything else fitness-related) and updated the coaching prompts to
      personalize the motivational nudge using fitness level + trend together
- [x] Trend graphs / milestones UI (Lionel) — **done Aug 16**: `app/TrendChart.tsx`, a simple
      bar chart of VO2max history, plus deterministic milestone detection (new high / 3+ day
      improving streak) in `lib/riskTrajectory.ts`. Landed after the Firestore fix below, as
      expected.
- [ ] Voice-to-text via Whisper (Eangelica) — new third-party integration, real scope, not
      feasible in the remaining time
- [ ] Apple HealthKit/Apple Watch support (Eangelica) — currently Fitbit/Google Health only;
      large scope, realistically roadmap-only for the narrative rather than built
- [ ] Lovable/Manus tooling (Eangelica) — unclear concrete action; alternative app builders,
      not obviously applicable on top of the existing tested Next.js codebase
- [ ] "Digital nurse" / hospital-chain interface framing (Digvijay/Eangelica) — pitch
      positioning idea, not a build item

**C. Compliance/legal**
- [x] Gemini free-tier training-data policy — **answered**: free-tier prompts/outputs can be
      used to improve Google's products (including training) and may be human-reviewed; paid
      tier (API or Vertex AI) is not used for training. EEA/UK/Switzerland get the no-training
      terms even on the free tier.
- [x] PII/HIPAA exposure — **answered, and the app is clean**: no name, email, or any direct
      identifier anywhere in the pipeline (session cookie, Firestore, Gemini, LangFuse) — all
      of it is de-identified health metrics only.
- [x] **GDPR-specific compliance** (team operates in Europe) — **draft done Aug 16**:
      `app/privacy/page.tsx` (special-category health data legal basis, cookies, third-party
      data sharing, international transfers, data retention — honestly flagged where real gaps
      remain, e.g. no real deletion mechanism yet) plus an explicit consent checkbox required
      before submitting the screening form in `app/StopBangForm.tsx`. Same status as
      `DISCLAIMER_DRAFT.md` — a real draft, not a substitute for actual legal review.
- [ ] Human legal/compliance read of `DISCLAIMER_DRAFT.md` — still outstanding since Aug 12
- [x] "Advisor, not doctor" liability framing (Digvijay) — **already done**: this is the entire
      premise of `DISCLAIMER_DRAFT.md` and the "never diagnose" enforcement in
      `lib/geminiCoach.ts`, tested via `validateGeminiCopy`/`validateFollowUpAnswer`

**D. Bugs/gaps found while researching this meeting**
- [x] **Firestore multi-user collision** — **fixed Aug 16**: `lib/session.ts`'s new
      `getUserKey()` derives a stable, non-identifying key (SHA-256 hash of the OAuth refresh
      token, truncated — never the raw token itself) to scope each user's logs in Firestore,
      replacing the old fixed `LOG_DOC_ID = "default"`. `lib/coachLog.ts` and
      `app/api/coach/route.ts` updated accordingly, tested.
- [ ] Workalyzer link — still waiting on Eangelica, unresolved since Aug 9

**E. Carried forward, still open**
- [ ] Demo recording — now more important than before, since Play Store is off the table as a
      way to show the live product working
- [ ] Video script/storyboard
- [ ] Mock P&L slide — possibly superseded by Eangelica's real business pitch; confirm with
      her which one's actually needed before doing both
- [x] Docker build/run local verification — **effectively resolved**: the live Cloud Run
      deployment proves the Dockerfile works end-to-end, a separate local `docker run` isn't
      adding new information at this point

## 10e. Implementation sprint on the Aug 16 checklist (same day)

Worked through §10d's list in priority order — real bugs and clear compliance gaps first,
then the two feature requests that were actually scoped enough to attempt with a day left:

1. **Firestore multi-user collision (D)** — fixed first since it blocked #4 from being
   meaningful. Real per-user keying via a hashed OAuth refresh token, never the token itself.
2. **GDPR privacy policy + consent (C)** — `app/privacy/page.tsx` plus a required consent
   checkbox before the STOP-BANG form submits. Same "real draft, not legal sign-off" status as
   `DISCLAIMER_DRAFT.md`.
3. **Personalized messaging (B)** — deterministic age-relative fitness classification, fed into
   the coaching prompts so the motivational nudge reflects both fitness level and trend, not
   trend alone.
4. **Trend chart + milestones (B)** — deterministic new-high/streak detection, simple bar chart
   in the UI, unblocked by #1.
5. **SpO2 (B)** — the one item initially called out of scope until actually checking whether
   the underlying data exists. It does (`daily-oxygen-saturation`, same OAuth scope already
   granted), so it got built: fetched as a wearable metric, classified against standard
   clinical thresholds, kept as supporting context only — same non-diagnostic treatment as
   VO2max, never an input to the STOP-BANG risk tier. **One real unknown left**: the exact
   response field name is inferred from Google's proto definition, not confirmed against a
   live response — needs an actual test against real Fitbit data to know for sure it parses
   correctly (same category of risk that caused the original heart-rate ordering bug).

Every step verified independently (`npm test`/`tsc`/`eslint`/`npm run build`) before committing
— 97 tests total by the end, up from 89 at the start of this sprint. All pushed to
`github.com/lio-cs/vo2max-predictor`, Cloud Run rebuilds automatically on each push.

**What's next:**
1. **Lionel:** test the live site again, specifically to confirm SpO2 actually parses against
   your real Fitbit data (the one unverified piece above)
2. Everything else genuinely still open is the same as §10d's remaining items: the Workalyzer
   link and APK-builds clarification (Eangelica), human legal review of both drafts, and
   submission prep (demo recording, video script, business pitch/P&L — confirm with Eangelica
   which of the last two is actually still needed)
3. Out of scope for the remaining time, per earlier discussion: Whisper voice-to-text, Apple
   HealthKit, Lovable/Manus

## 10f. Coach panel UI/UX redesign sprint (Aug 15)

Jyrah's full UI/UX pass on the Coach panel, working directly in the live repo (not a separate
mockup) against `AEROCOACH_COACH_PANEL_UI_UX_SPEC.md`'s six-state design. Five commits, each
verified before moving to the next since there's no local Node/npm in this environment — no
`npm run build`/`tsc`/`eslint` this round, so changes leaned on careful manual review plus a
parallel static HTML mockup kept in sync with the real components as a stand-in preview.

1. **`f9adf8e` — spec-compliance audit.** Retired "VO2 Max Predictor" branding for AeroCoach;
   dropped the raw "STOP-BANG X/8" numeric score and red/amber/emerald risk-tier coloring from
   the result badge (spec explicitly bans numeric scores and warning colors); split
   insufficient-data (state 3) from actual errors (state 6), each neutral/reassuring rather than
   alarming; restructured the coaching result into what/why/next per spec §4.4; aligned
   disclaimer wording across states 1 and 4.
2. **`c3888d7` — full-screen responsive layout + better loading state.** Replaced the boxed
   `max-w-md` card with a full-bleed `min-h-dvh` shell and a centered `max-w-2xl` column that
   scales from phone to laptop, closer to a Gemini/Claude-style app frame (explicit ask: make it
   feel full-screen on laptop like those chat UIs). Added `LoadingLines.tsx`, a reusable
   rotating-status component (cycles through what's happening, falls back to a "still working"
   message after ~9s) — replaces state 2's bare disabled button, reused for both the initial
   Fitbit/Health fetch (`ConnectingState.tsx`, new Suspense fallback) and the Gemini coaching
   call inside the form.
3. **`454b584` — formal navy/off-white/teal rebrand + Fraunces display font.** Added Fraunces
   (`next/font/google`) as a display face for the wordmark/hero/headings only — Geist Sans stays
   the body font. Fixed a real bug along the way: `globals.css` hardcoded `font-family: Arial`
   on `body`, silently overriding the Geist Sans that was already loaded. Replaced the flat
   Tailwind zinc palette with semantic navy/off-white/teal design tokens (`paper`, `ink`,
   `accent`, etc.) that swap light/dark automatically via the existing
   `--background`/`--foreground` media-query pattern, removing the need for paired `dark:`
   classes everywhere. Moved the marketing hero paragraph + disclaimer so they render only on
   the not-connected landing state instead of repeating on every screen; added a small
   persistent brand row (wordmark + live pulse dot) shown across the other states instead. Added
   tasteful motion — gradient-accent hero text, a slow breath-paced glow behind the hero,
   animated equalizer bars on the VO2max stat — all disabled under `prefers-reduced-motion`.
4. **`b6f68e9` → `c1d4209` — muted-surface color fix + minimalist icons.** First pass swapped the
   original beige muted surface for a light teal tint; feedback was that it still clashed with
   the off-white base, so the surface color (`--paper-alt`) was moved to the navy family instead
   (`#e2e7e8` light / `#13293c` dark) — teal (`--accent`/`--accent-soft`) now stays reserved
   purely for buttons, badges, and icons rather than doing double duty as a neutral surface.
   Added small single-stroke SVG icons with no new icon dependency: an animated pulse/waveform
   line on the connecting state (2), a nights-progress dot row on the insufficient-data state
   (3), and a calm retry-arrow on the error state (6). State 1 (the landing page) was
   deliberately left untouched per explicit feedback that it was already right.

**Files touched:** `app/page.tsx`, `app/StopBangForm.tsx`, `app/FollowUpChat.tsx`,
`app/layout.tsx`, `app/globals.css`, plus two new components (`app/LoadingLines.tsx`,
`app/ConnectingState.tsx`). All five commits pushed to `master`; Cloud Run's continuous
deployment (§10c) picked each one up automatically.

**Not done this round, worth flagging:** no local build/lint/type-check was possible (no
Node/npm in this working environment), so verification was manual review only — worth a real
`npm run build`/`tsc`/`eslint` pass from a machine that has Node before this is treated as fully
verified, same caution as the Docker build note in §6.

## 10g. Data separation from identity (Digvijay's feedback, Aug 16)

Digvijay flagged: medical data should be separated from the user, to prevent it being read and
linked by Gemini. Checked the actual data flow before responding rather than assuming either
"already fine" or "needs a rebuild":

**Already true, confirmed by re-reading the code:**
- Gemini never receives your name, email, Google account ID, session cookie, or OAuth token —
  `lib/geminiCoach.ts`'s prompts contain only computed metrics (STOP-BANG score/tier, VO2max,
  SpO2, fitness trend/history dates)
- The Gemini API call is made server-side using the app's own API key, not anything tied to the
  end user's Google account — so Google's Gemini endpoint doesn't see the user's identity on
  that call either
- Cross-session linking (for trend/history) happens through `getUserKey()` — a one-way SHA-256
  hash of the OAuth refresh token, never the token or an identity itself

**One real gap found and fixed:** the follow-up chat is the only surface accepting free-form
text — someone could type an email or phone number directly into a question, and it would have
flowed to Gemini (and into the LangFuse trace) unfiltered. Added `lib/piiRedaction.ts`: a
best-effort scrub of email/phone patterns run on the user's question and their own prior chat
turns before the prompt is built. Deliberately does **not** attempt name-detection — a
regex/keyword guesser for names would be unreliable enough to create false confidence, so the
disclosure is honest about that limit instead of overclaiming coverage. Surfaced to the user via
a small notice in `FollowUpChat.tsx` when redaction actually fires.

`app/privacy/page.tsx` updated with a new "Keeping your identity separate from your health data"
section explaining all of the above in plain English — this is the direct answer to Digvijay's
concern, not just a code change.

Verified: 104 tests passing (7 new, for the redaction module), lint clean, build clean.

## 10. Session summary (this Claude session, Aug 10–11) and what's next

**What got done, end to end:** reconciled the whole plan against the real Aug 9 mentor meeting
(category, product framing, team); fact-checked both of Jyrah's marketing briefs against
primary sources (all real, not fabricated) and resolved the domain/brand/product-scope
questions; ran and QA'd the codebase, finding and fixing a real bug in the Fitbit connector
(stale heart-rate data); resolved both decisions blocking further build (OSA-vs-cardiometabolic
framing, tech stack) and implemented the OSA/STOP-BANG rework same-day; wired in LangFuse
observability, prompt guardrails, rate limiting, and a Docker build; cleared the
`sleepfm-clinical` data-use compliance question; and drafted the medical/compliance disclaimer.
Every code change was verified (`build`/`lint`/`tsc`/smoke tests) before being marked done.

**What's next — genuinely blocked on the team, not on more AI-assisted work:**

*(Superseded by §10b — items below marked done there are done. Kept here for the original
context/dates.)*

1. **Jyrah:** UI/UX pass on `app/StopBangForm.tsx` (now also `app/FollowUpChat.tsx`) — the
   competitive/market scan is done (§7a), including a real positioning shift (retire "zero new
   hardware") that should show up in this pass
2. **Lionel:** set up project tools within the Gemini platform; chase Eangelica for the
   safety/guardrails API link and the Workalyzer link (outstanding since Aug 9)
3. ~~Live end-to-end test~~ — **done Aug 14–15**, see §10b (found + fixed two real bugs in the
   process, then added the follow-up chat feature based on what that first real run surfaced)
4. **Lionel:** run an actual `docker build`/`docker run` on a machine that has Docker (only
   structurally verified in this session, not run)
5. **Whoever owns it:** an actual human legal/compliance read on `DISCLAIMER_DRAFT.md` — it's
   prep, not sign-off
6. **Lionel:** properly fix the `FIRESTORE_SERVICE_ACCOUNT_KEY` JSON formatting in `.env.local`
   (currently commented out to unblock testing — see §10b)
7. Once the above land: demo recording, video script, mock P&L slide (submission prep —
   the practice narrative draft is done, see §6 and `NARRATIVE_DRAFT.md`)

## 11. Notes from the mentor worth keeping in view

- Focus on a working **end-to-end MVP** before optimizing anything — security, auth, and PII
  masking are explicitly phase two.
- The solution needs to be a genuinely **multimodal or generative AI application** to be
  eligible, not just a thin wrapper.
- Success factor Digvijay flagged: explain the product simply enough for someone who doesn't
  know what OSA or machine learning is.
- Reuse existing open datasets (Stanford sleep dataset, the Nature paper) rather than building
  everything from scratch.
